package com.guardian;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;

/** Minimal MQTT 3.1.1 test peer: CONNECT, SUBSCRIBE, PING and QoS0 telemetry.
 * Local software fixture only; it does not emulate sensors or prove hardware operation.
 */
final class TestMqttBroker implements AutoCloseable {
    private final ServerSocket server;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final CountDownLatch subscribed = new CountDownLatch(6);
    private volatile Socket socket;
    TestMqttBroker() throws IOException {
        server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress());
        worker.submit(() -> {
            try (Socket connection = server.accept()) {
                socket = connection;
                InputStream input = connection.getInputStream();
                int header;
                while ((header = input.read()) >= 0) {
                    int length = 0, multiplier = 1, digit;
                    do { digit = input.read(); if (digit < 0) return; length += (digit & 127) * multiplier; multiplier *= 128; } while ((digit & 128) != 0);
                    byte[] body = input.readNBytes(length);
                    switch (header >> 4) {
                        case 1 -> send(0x20, new byte[]{0,0});
                        case 8 -> {
                            send(0x90, new byte[]{body[0], body[1], 0});
                            subscribed.countDown();
                        }
                        case 12 -> send(0xd0, new byte[0]);
                        case 14 -> { return; }
                        default -> { }
                    }
                }
            } catch (IOException ignored) { /* normal when closed */ }
        });
    }
    int port() { return server.getLocalPort(); }
    void awaitSubscriptions() throws InterruptedException {
        if (!subscribed.await(3,TimeUnit.SECONDS)) throw new AssertionError("MQTT subscriptions did not complete");
    }
    void publish(String topic, String json) throws IOException {
        byte[] name = topic.getBytes(StandardCharsets.UTF_8);
        var body = new ByteArrayOutputStream();
        body.write(name.length >> 8); body.write(name.length & 255); body.write(name); body.write(json.getBytes(StandardCharsets.UTF_8));
        send(0x30, body.toByteArray());
    }
    private synchronized void send(int header, byte[] body) throws IOException {
        OutputStream output = socket.getOutputStream();
        output.write(header);
        int length = body.length;
        do { int digit = length % 128; length /= 128; if (length > 0) digit |= 128; output.write(digit); } while (length > 0);
        output.write(body); output.flush();
    }
    @Override public void close() throws IOException {
        if (socket != null) socket.close(); server.close(); worker.shutdownNow();
    }
}
