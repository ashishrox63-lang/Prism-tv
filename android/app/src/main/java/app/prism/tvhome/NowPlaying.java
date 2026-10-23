package app.prism.tvhome;

import android.content.ComponentName;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.service.notification.NotificationListenerService;
import android.view.KeyEvent;

import org.json.JSONObject;

import java.util.List;

/**
 * Reads what is playing (Apple Music, Spotify, YouTube Music and others) for the now-playing card.
 * Android only shares this with an enabled notification listener, which this service is.
 * On Android TV it is turned on once with:
 * adb shell cmd notification allow_listener app.prism.tvhome/app.prism.tvhome.NowPlaying
 */
public class NowPlaying extends NotificationListenerService {

    private static byte[] art;
    private static String artKey = "";

    private static MediaController active(Context ctx) {
        try {
            MediaSessionManager m = (MediaSessionManager) ctx.getSystemService(Context.MEDIA_SESSION_SERVICE);
            List<MediaController> list = m.getActiveSessions(new ComponentName(ctx, NowPlaying.class));
            MediaController best = null;
            for (MediaController c : list) {
                PlaybackState s = c.getPlaybackState();
                if (s != null && s.getState() == PlaybackState.STATE_PLAYING) return c;
                if (best == null && c.getMetadata() != null) best = c;
            }
            return best;
        } catch (SecurityException e) {
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    static String currentJson(Context ctx) {
        MediaController c = active(ctx);
        if (c == null || c.getMetadata() == null) return "";
        try {
            MediaMetadata md = c.getMetadata();
            String title = md.getString(MediaMetadata.METADATA_KEY_TITLE);
            if (title == null || title.length() == 0) return "";
            String artist = md.getString(MediaMetadata.METADATA_KEY_ARTIST);
            if (artist == null) artist = md.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST);
            PlaybackState s = c.getPlaybackState();
            String pkg = c.getPackageName();
            String key = pkg + "|" + title;
            if (!key.equals(artKey)) {
                artKey = key;
                Bitmap b = md.getBitmap(MediaMetadata.METADATA_KEY_ART);
                if (b == null) b = md.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART);
                art = b == null ? null : AppCatalog.toPng(Bitmap.createScaledBitmap(b, 160, 160, true));
            }
            JSONObject o = new JSONObject();
            o.put("pkg", pkg);
            o.put("app", label(ctx, pkg));
            o.put("title", title);
            o.put("artist", artist == null ? "" : artist);
            o.put("playing", s != null && s.getState() == PlaybackState.STATE_PLAYING);
            if (art != null) o.put("art", WebHost.BASE + "now-art?v=" + Math.abs(key.hashCode()));
            return o.toString();
        } catch (Exception e) {
            return "";
        }
    }

    static byte[] artPng() { return art; }

    private static String label(Context ctx, String pkg) {
        try {
            PackageManager pm = ctx.getPackageManager();
            return String.valueOf(pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)));
        } catch (Exception e) {
            return "";
        }
    }

    static void control(Context ctx, String cmd) {
        MediaController c = active(ctx);
        if (c != null) {
            MediaController.TransportControls t = c.getTransportControls();
            PlaybackState s = c.getPlaybackState();
            if ("next".equals(cmd)) t.skipToNext();
            else if ("prev".equals(cmd)) t.skipToPrevious();
            else if (s != null && s.getState() == PlaybackState.STATE_PLAYING) t.pause();
            else t.play();
            return;
        }
        int code = "next".equals(cmd) ? KeyEvent.KEYCODE_MEDIA_NEXT : "prev".equals(cmd) ? KeyEvent.KEYCODE_MEDIA_PREVIOUS : KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE;
        AudioManager am = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
        am.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, code));
        am.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, code));
    }
}
