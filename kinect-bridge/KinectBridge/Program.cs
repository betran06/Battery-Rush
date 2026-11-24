using Microsoft.Kinect;
using System;
using System.Collections.Concurrent;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace KinectBridge
{
    internal class BridgeClient
    {
        public WebSocket Socket { get; private set; }
        public SemaphoreSlim SendLock { get; private set; } = new SemaphoreSlim(1, 1);
        public BridgeClient(WebSocket socket) { Socket = socket; }
    }

    internal class Program
    {
        private static readonly ConcurrentBag<BridgeClient> Clients = new ConcurrentBag<BridgeClient>();
        private static KinectSensor _sensor;
        private static long _frameNumber;
        private static volatile bool _running = true;

        private static void Main(string[] args)
        {
            Console.OutputEncoding = Encoding.UTF8;
            Console.WriteLine("========================================");
            Console.WriteLine(" Battery Rush - Kinect V1 Bridge");
            Console.WriteLine("========================================");

            try
            {
                _sensor = KinectSensor.KinectSensors.FirstOrDefault(s => s.Status == KinectStatus.Connected);
                if (_sensor == null)
                {
                    Console.WriteLine("[ERROR] Kinect tidak ditemukan / tidak berstatus Connected.");
                    Console.WriteLine("Periksa adaptor daya, USB, dan Kinect Runtime 1.8.");
                    WaitBeforeExit();
                    return;
                }

                _sensor.SkeletonStream.Enable();
                _sensor.SkeletonFrameReady += OnSkeletonFrameReady;
                _sensor.Start();
                Console.WriteLine("[OK] Kinect connected: " + _sensor.DeviceConnectionId);
                Console.WriteLine("[OK] Skeleton stream enabled.");
            }
            catch (Exception ex)
            {
                Console.WriteLine("[ERROR] Gagal memulai Kinect: " + ex.Message);
                WaitBeforeExit();
                return;
            }

            Task serverTask = RunWebSocketServerAsync();
            Console.WriteLine("[READY] WebSocket: ws://127.0.0.1:8181/kinect");
            Console.WriteLine("Buka Battery Rush di browser setelah bridge ini berjalan.");
            Console.WriteLine("Tekan ENTER untuk menghentikan bridge.");
            Console.ReadLine();
            _running = false;

            try { _sensor.SkeletonFrameReady -= OnSkeletonFrameReady; _sensor.Stop(); }
            catch { }
            foreach (var client in Clients)
            {
                try { client.Socket.Abort(); client.Socket.Dispose(); }
                catch { }
            }
            try { serverTask.Wait(1000); } catch { }
        }

        private static async Task RunWebSocketServerAsync()
        {
            var listener = new HttpListener();
            listener.Prefixes.Add("http://127.0.0.1:8181/");
            try
            {
                listener.Start();
                while (_running)
                {
                    HttpListenerContext context;
                    try { context = await listener.GetContextAsync().ConfigureAwait(false); }
                    catch (HttpListenerException) { break; }

                    if (!context.Request.IsWebSocketRequest || context.Request.Url.AbsolutePath != "/kinect")
                    {
                        context.Response.StatusCode = 200;
                        byte[] body = Encoding.UTF8.GetBytes("Battery Rush Kinect Bridge is running. Connect to ws://127.0.0.1:8181/kinect");
                        context.Response.OutputStream.Write(body, 0, body.Length);
                        context.Response.Close();
                        continue;
                    }

                    _ = HandleWebSocketClientAsync(context);
                }
            }
            catch (HttpListenerException ex)
            {
                Console.WriteLine("[ERROR] WebSocket server: " + ex.Message);
                Console.WriteLine("Coba jalankan aplikasi sebagai Administrator jika port/URL ACL ditolak.");
            }
            finally { if (listener.IsListening) listener.Stop(); listener.Close(); }
        }

        private static async Task HandleWebSocketClientAsync(HttpListenerContext context)
        {
            WebSocket socket = null;
            try
            {
                var result = await context.AcceptWebSocketAsync(null).ConfigureAwait(false);
                socket = result.WebSocket;
                var client = new BridgeClient(socket);
                Clients.Add(client);
                Console.WriteLine("[CLIENT] Browser connected.");
                var buffer = new byte[256];
                while (_running && socket.State == WebSocketState.Open)
                {
                    var receive = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None).ConfigureAwait(false);
                    if (receive.MessageType == WebSocketMessageType.Close) break;
                }
            }
            catch (Exception ex) { Console.WriteLine("[CLIENT] Connection ended: " + ex.Message); }
            finally
            {
                if (socket != null)
                {
                    try { if (socket.State == WebSocketState.Open) await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Bridge closing", CancellationToken.None).ConfigureAwait(false); }
                    catch { }
                    socket.Dispose();
                }
                Console.WriteLine("[CLIENT] Browser disconnected.");
            }
        }

        private static void OnSkeletonFrameReady(object sender, SkeletonFrameReadyEventArgs e)
        {
            using (SkeletonFrame frame = e.OpenSkeletonFrame())
            {
                if (frame == null) return;
                var skeletons = new Skeleton[frame.SkeletonArrayLength];
                frame.CopySkeletonDataTo(skeletons);
                var tracked = skeletons
                    .Where(s => s.TrackingState == SkeletonTrackingState.Tracked)
                    .OrderBy(s => Math.Abs(s.Position.X))
                    .FirstOrDefault();

                string json;
                if (tracked == null)
                {
                    long timestamp = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalMilliseconds;
                    json = "{\"type\":\"skeleton-frame\",\"tracking\":false,\"frame\":" + Interlocked.Increment(ref _frameNumber) + ",\"timestamp\":" + timestamp + "}";
                }
                else
                {
                    var hip = tracked.Joints[JointType.HipCenter];
                    var leftKnee = tracked.Joints[JointType.KneeLeft];
                    var rightKnee = tracked.Joints[JointType.KneeRight];
                    var leftAnkle = tracked.Joints[JointType.AnkleLeft];
                    var rightAnkle = tracked.Joints[JointType.AnkleRight];
                    var head = tracked.Joints[JointType.Head];
                    var shoulderCenter = tracked.Joints[JointType.ShoulderCenter];
                    var shoulderLeft = tracked.Joints[JointType.ShoulderLeft];
                    var shoulderRight = tracked.Joints[JointType.ShoulderRight];
                    var spine = tracked.Joints[JointType.Spine];
                    var footLeft = tracked.Joints[JointType.FootLeft];
                    var footRight = tracked.Joints[JointType.FootRight];

                    long timestamp = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalMilliseconds;
                    json = "{\"type\":\"skeleton-frame\",\"tracking\":true,\"frame\":" + Interlocked.Increment(ref _frameNumber) +
                        ",\"timestamp\":" + timestamp +
                        ",\"joints\":{\"hipCenter\":" + JointJson(hip) +
                        ",\"kneeLeft\":" + JointJson(leftKnee) +
                        ",\"kneeRight\":" + JointJson(rightKnee) +
                        ",\"ankleLeft\":" + JointJson(leftAnkle) +
                        ",\"ankleRight\":" + JointJson(rightAnkle) +
                        ",\"head\":" + JointJson(head) +
                        ",\"shoulderCenter\":" + JointJson(shoulderCenter) +
                        ",\"shoulderLeft\":" + JointJson(shoulderLeft) +
                        ",\"shoulderRight\":" + JointJson(shoulderRight) +
                        ",\"spine\":" + JointJson(spine) +
                        ",\"footLeft\":" + JointJson(footLeft) +
                        ",\"footRight\":" + JointJson(footRight) + "}}";
                }
                _ = BroadcastAsync(json);
            }
        }

        private static string JointJson(Joint joint)
        {
            var p = joint.Position;
            return "{\"x\":" + p.X.ToString("0.0000", CultureInfo.InvariantCulture) +
                   ",\"y\":" + p.Y.ToString("0.0000", CultureInfo.InvariantCulture) +
                   ",\"z\":" + p.Z.ToString("0.0000", CultureInfo.InvariantCulture) +
                   ",\"state\":\"" + joint.TrackingState.ToString().ToLowerInvariant() + "\"}";
        }

        private static async Task BroadcastAsync(string json)
        {
            byte[] bytes = Encoding.UTF8.GetBytes(json);
            foreach (var client in Clients)
            {
                if (client.Socket.State != WebSocketState.Open) continue;
                try
                {
                    await client.SendLock.WaitAsync().ConfigureAwait(false);
                    try
                    {
                        if (client.Socket.State == WebSocketState.Open)
                            await client.Socket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None).ConfigureAwait(false);
                    }
                    finally { client.SendLock.Release(); }
                }
                catch { }
            }
        }

        private static void WaitBeforeExit()
        {
            Console.WriteLine("Tekan ENTER untuk keluar.");
            Console.ReadLine();
        }
    }
}