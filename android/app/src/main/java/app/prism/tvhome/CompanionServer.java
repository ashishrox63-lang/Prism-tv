package app.prism.tvhome;

import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.view.KeyEvent;

import org.json.JSONObject;

import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * A small web server on the home Wi-Fi (port 8765) that serves the phone remote page and its API.
 * Every API call must carry the pairing token shown in the TV's QR code.
 */
class CompanionServer {

    private final Context ctx;
    private final ExecutorService pool = Executors.newFixedThreadPool(4);
    private volatile ServerSocket socket;

    CompanionServer(Context c) { ctx = c.getApplicationContext(); }

    void start() {
        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {
                while (true) {
                    try {
                        socket = new ServerSocket(PrismApp.PORT);
                        while (true) {
                            final Socket s = socket.accept();
                            pool.execute(new Runnable() {
                                @Override
                                public void run() { handle(s); }
                            });
                        }
                    } catch (IOException e) {
                        try { if (socket != null) socket.close(); } catch (IOException ignored) { }
                        try { Thread.sleep(5000); } catch (InterruptedException ie) { return; }
                    }
                }
            }
        }, "prism-companion");
        t.setDaemon(true);
        t.start();
    }

    /* ---------- HTTP ---------- */

    private static class Req {
        String method, path, query = "";
        Map<String, String> headers = new HashMap<String, String>();
        Map<String, String> params = new HashMap<String, String>();
        InputStream body;
        int length;
    }

    private void handle(Socket s) {
        try {
            s.setSoTimeout(30000);
            InputStream in = new BufferedInputStream(s.getInputStream());
            OutputStream out = s.getOutputStream();
            Req r = parse(in);
            if (r == null) { s.close(); return; }
            route(r, out);
            out.flush();
        } catch (Exception ignored) {
        } finally {
            try { s.close(); } catch (IOException ignored) { }
        }
    }

    private static String line(InputStream in) throws IOException {
        StringBuilder b = new StringBuilder();
        int c;
        while ((c = in.read()) >= 0) {
            if (c == '\n') break;
            if (c != '\r') b.append((char) c);
            if (b.length() > 8192) throw new IOException("line too long");
        }
        return c < 0 && b.length() == 0 ? null : b.toString();
    }

    private static Req parse(InputStream in) throws IOException {
        String first = line(in);
        if (first == null) return null;
        String[] p = first.split(" ");
        if (p.length < 2) return null;
        Req r = new Req();
        r.method = p[0];
        String target = p[1];
        int q = target.indexOf('?');
        r.path = q >= 0 ? target.substring(0, q) : target;
        if (q >= 0) {
            r.query = target.substring(q + 1);
            for (String kv : r.query.split("&")) {
                int e = kv.indexOf('=');
                if (e > 0) r.params.put(URLDecoder.decode(kv.substring(0, e), "UTF-8"), URLDecoder.decode(kv.substring(e + 1), "UTF-8"));
            }
        }
        String h;
        while ((h = line(in)) != null && h.length() > 0) {
            int c = h.indexOf(':');
            if (c > 0) r.headers.put(h.substring(0, c).trim().toLowerCase(), h.substring(c + 1).trim());
        }
        try { r.length = Integer.parseInt(r.headers.containsKey("content-length") ? r.headers.get("content-length") : "0"); } catch (NumberFormatException e) { r.length = 0; }
        r.body = in;
        return r;
    }

    private static String readBody(Req r, int max) throws IOException {
        if (r.length <= 0 || r.length > max) return "";
        byte[] b = new byte[r.length];
        int off = 0;
        while (off < r.length) {
            int n = r.body.read(b, off, r.length - off);
            if (n < 0) break;
            off += n;
        }
        return new String(b, 0, off, "UTF-8");
    }

    private static void send(OutputStream out, int code, String type, byte[] body, boolean cache) throws IOException {
        String head = "HTTP/1.1 " + code + (code == 200 ? " OK" : code == 401 ? " Unauthorized" : code == 404 ? " Not Found" : " Error") + "\r\n"
                + "Content-Type: " + type + "\r\n"
                + "Content-Length: " + body.length + "\r\n"
                + "Cache-Control: " + (cache ? "max-age=3600" : "no-store") + "\r\n"
                + "X-Content-Type-Options: nosniff\r\n"
                + "Connection: close\r\n\r\n";
        out.write(head.getBytes("UTF-8"));
        out.write(body);
    }

    private static void json(OutputStream out, int code, String json) throws IOException {
        send(out, code, "application/json; charset=utf-8", json.getBytes("UTF-8"), false);
    }

    private static String msg(boolean ok, String message) {
        try { JSONObject o = new JSONObject(); o.put("ok", ok); if (message != null) o.put("message", message); return o.toString(); } catch (Exception e) { return "{\"ok\":" + ok + "}"; }
    }

    /* ---------- Routes ---------- */

    private void route(Req r, OutputStream out) throws Exception {
        String path = r.path;
        if (path.equals("/") || path.equals("/index.html") || path.equals("/phone.css") || path.equals("/phone.js")) {
            String name = path.equals("/") ? "index.html" : path.substring(1);
            send(out, 200, WebHost.mime(name) + (name.endsWith(".js") || name.endsWith(".css") || name.endsWith(".html") ? "; charset=utf-8" : ""), asset("phone/" + name), false);
            return;
        }
        if (!path.startsWith("/api/")) { send(out, 404, "text/plain", "Not found".getBytes("UTF-8"), false); return; }
        String token = r.headers.containsKey("x-prism-token") ? r.headers.get("x-prism-token") : r.params.get("t");
        if (token == null || !token.equals(PrismApp.app.token())) { json(out, 401, msg(false, "Not paired")); return; }

        switch (path) {
            case "/api/state": {
                String res = PrismApp.app.evalBlocking("window.Prism ? Prism.remote('{\"type\":\"state\"}') : null", 4000);
                if (res == null) json(out, 503, msg(false, "Open Prism on the TV first"));
                else json(out, 200, res);
                return;
            }
            case "/api/cmd": {
                String body = readBody(r, 200000);
                String res = PrismApp.app.evalBlocking("window.Prism ? Prism.remote(" + JSONObject.quote(body) + ") : null", 4000);
                if (res == null) json(out, 503, msg(false, "Open Prism on the TV first"));
                else json(out, 200, res);
                return;
            }
            case "/api/key": {
                String k = new JSONObject(readBody(r, 2000)).optString("key");
                json(out, 200, key(k));
                return;
            }
            case "/api/text": {
                JSONObject j = new JSONObject(readBody(r, 20000));
                json(out, 200, text(j.optString("text"), j.optString("target", "prism"), j.optBoolean("enter")));
                return;
            }
            case "/api/photos": {
                json(out, 200, "{\"ok\":true,\"photos\":" + Photos.json(ctx, "/api/photo-file/", "?t=" + PrismApp.app.token()) + "}");
                return;
            }
            case "/api/photo": {
                String name = r.params.containsKey("name") ? r.params.get("name") : System.currentTimeMillis() + ".jpg";
                boolean ok = Photos.save(ctx, name.replaceAll("[^A-Za-z0-9._-]", ""), r.body, r.length);
                json(out, ok ? 200 : 400, msg(ok, ok ? null : "That photo is too large"));
                return;
            }
            case "/api/photo-delete": {
                Photos.delete(ctx, new JSONObject(readBody(r, 2000)).optString("name"));
                json(out, 200, msg(true, "Photo removed"));
                return;
            }
            case "/api/apk": {
                if (r.length <= 0 || r.length > 80 * 1024 * 1024) { json(out, 400, msg(false, "That file is not a Prism update")); return; }
                File f = new File(ctx.getCacheDir(), "update.apk");
                FileOutputStream fo = new FileOutputStream(f);
                try {
                    byte[] buf = new byte[65536];
                    int left = r.length;
                    while (left > 0) {
                        int n = r.body.read(buf, 0, Math.min(buf.length, left));
                        if (n < 0) break;
                        fo.write(buf, 0, n);
                        left -= n;
                    }
                } finally { fo.close(); }
                String err = Updater.installFile(ctx, f);
                JSONObject o = new JSONObject();
                o.put("ok", err == null);
                if (err != null) o.put("error", err);
                json(out, 200, o.toString());
                return;
            }
            default:
                if (path.startsWith("/api/photo-file/")) {
                    File f = Photos.file(ctx, path.substring(16));
                    if (f == null || !f.exists()) { send(out, 404, "text/plain", new byte[0], false); return; }
                    send(out, 200, "image/jpeg", readFile(f), true);
                    return;
                }
                send(out, 404, "text/plain", "Not found".getBytes("UTF-8"), false);
        }
    }

    /** Remote keys: Prism handles everything when it is on screen; other apps get what Android allows. */
    private String key(String k) {
        AudioManager am = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
        switch (k) {
            case "playpause": media(am, KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE); return msg(true, null);
            case "volup": am.adjustSuggestedStreamVolume(AudioManager.ADJUST_RAISE, AudioManager.STREAM_MUSIC, AudioManager.FLAG_SHOW_UI); return msg(true, null);
            case "voldown": am.adjustSuggestedStreamVolume(AudioManager.ADJUST_LOWER, AudioManager.STREAM_MUSIC, AudioManager.FLAG_SHOW_UI); return msg(true, null);
            case "mute": am.adjustSuggestedStreamVolume(AudioManager.ADJUST_TOGGLE_MUTE, AudioManager.STREAM_MUSIC, AudioManager.FLAG_SHOW_UI); return msg(true, null);
            default: break;
        }
        if (PrismApp.foreground) {
            String res = PrismApp.app.evalBlocking("window.Prism ? JSON.stringify(Prism.remote('{\"type\":\"key\",\"key\":\"" + k.replaceAll("[^a-z]", "") + "\"}')) : null", 3000);
            return res != null ? msg(true, null) : msg(false, "Prism is starting. Try again in a moment.");
        }
        if ("home".equals(k)) {
            if (PrismAccess.global("home")) return msg(true, null);
            Intent i = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            try { ctx.startActivity(i); return msg(true, null); } catch (Exception e) { return msg(false, "Press Home on the TV remote"); }
        }
        if ("back".equals(k)) return PrismAccess.global("back") ? msg(true, null) : msg(false, "Back in other apps needs Prism turned on in Accessibility settings");
        int code = "up".equals(k) ? KeyEvent.KEYCODE_DPAD_UP : "down".equals(k) ? KeyEvent.KEYCODE_DPAD_DOWN : "left".equals(k) ? KeyEvent.KEYCODE_DPAD_LEFT
                : "right".equals(k) ? KeyEvent.KEYCODE_DPAD_RIGHT : "ok".equals(k) ? KeyEvent.KEYCODE_DPAD_CENTER : 0;
        if (code != 0 && PrismKeyboard.key(code)) return msg(true, null);
        return msg(false, "In other apps, use Back, Home, play and volume here. Arrows work in Prism.");
    }

    private static void media(AudioManager am, int code) {
        am.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, code));
        am.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, code));
    }

    private String text(String t, String target, boolean enter) {
        if ("app".equals(target) || !PrismApp.foreground) {
            if (PrismKeyboard.type(t, enter)) return msg(true, "Sent");
            if (!PrismApp.foreground) return msg(false, "Turn on Prism Keyboard on the TV to type into other apps (see Settings tab)");
        }
        try {
            JSONObject c = new JSONObject();
            c.put("type", "text"); c.put("text", t); c.put("enter", enter);
            String res = PrismApp.app.evalBlocking("window.Prism ? Prism.remote(" + JSONObject.quote(c.toString()) + ") : null", 3000);
            return res != null ? msg(true, null) : msg(false, "Open Prism on the TV first");
        } catch (Exception e) {
            return msg(false, null);
        }
    }

    private byte[] asset(String name) throws IOException {
        InputStream in = ctx.getAssets().open(name);
        try { return readAll(in); } finally { in.close(); }
    }

    private static byte[] readFile(File f) throws IOException {
        InputStream in = new FileInputStream(f);
        try { return readAll(in); } finally { in.close(); }
    }

    private static byte[] readAll(InputStream in) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        return out.toByteArray();
    }
}
