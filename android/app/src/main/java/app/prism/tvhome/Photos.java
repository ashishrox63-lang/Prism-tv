package app.prism.tvhome;

import android.content.Context;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Comparator;

/** Family photos sent from the phone, stored privately on the TV. */
final class Photos {

    private Photos() { }

    static File dir(Context ctx) {
        File d = new File(ctx.getFilesDir(), "photos");
        if (!d.exists()) d.mkdirs();
        return d;
    }

    /** Only simple file names are accepted, so a request can never reach outside the photos folder. */
    static File file(Context ctx, String name) {
        if (name == null || !name.matches("[A-Za-z0-9._-]{1,80}") || name.startsWith(".")) return null;
        return new File(dir(ctx), name);
    }

    static File[] list(Context ctx) {
        File[] fs = dir(ctx).listFiles();
        if (fs == null) return new File[0];
        Arrays.sort(fs, new Comparator<File>() {
            @Override
            public int compare(File a, File b) { return Long.compare(b.lastModified(), a.lastModified()); }
        });
        return fs;
    }

    static String json(Context ctx, String base, String suffix) {
        JSONArray a = new JSONArray();
        for (File f : list(ctx)) {
            try {
                JSONObject o = new JSONObject();
                o.put("name", f.getName());
                o.put("url", base + f.getName() + suffix);
                o.put("t", f.lastModified());
                a.put(o);
            } catch (Exception ignored) { }
        }
        return a.toString();
    }

    static boolean save(Context ctx, String name, InputStream in, int length) throws IOException {
        File f = file(ctx, name);
        if (f == null || length <= 0 || length > 15 * 1024 * 1024) return false;
        FileOutputStream out = new FileOutputStream(f);
        try {
            byte[] buf = new byte[16384];
            int left = length;
            while (left > 0) {
                int n = in.read(buf, 0, Math.min(buf.length, left));
                if (n < 0) break;
                out.write(buf, 0, n);
                left -= n;
            }
        } finally {
            out.close();
        }
        if (list(ctx).length > 300) list(ctx)[300].delete();
        return true;
    }

    static boolean delete(Context ctx, String name) {
        File f = file(ctx, name);
        return f != null && f.delete();
    }
}
