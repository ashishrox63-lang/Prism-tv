package app.prism.tvhome;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.PowerManager;

import java.util.Calendar;

/**
 * Night switch-off. At the time you choose (9:00 pm by default) Prism comes to the front with a
 * one-minute countdown, then puts the TV into standby. Rescheduled after every restart.
 */
public class NightReceiver extends BroadcastReceiver {

    static final String ACTION = "app.prism.tvhome.NIGHT";

    @Override
    public void onReceive(Context ctx, Intent intent) {
        String a = intent.getAction();
        if (!ACTION.equals(a)) { schedule(ctx); return; }
        SharedPreferences p = ctx.getSharedPreferences("prism", Context.MODE_PRIVATE);
        long due = p.getLong("nightAt", 0);
        schedule(ctx);
        PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
        if (pm == null || !pm.isInteractive()) return;            /* TV already off */
        if (Math.abs(System.currentTimeMillis() - due) > 15 * 60000) return; /* delivered late after standby */
        Intent i = new Intent(ctx, MainActivity.class).putExtra("sleep", true)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        try { ctx.startActivity(i); } catch (Exception ignored) { }
    }

    private static PendingIntent pending(Context ctx) {
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        return PendingIntent.getBroadcast(ctx, 7, new Intent(ctx, NightReceiver.class).setAction(ACTION), flags);
    }

    static void schedule(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences("prism", Context.MODE_PRIVATE);
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        am.cancel(pending(ctx));
        String t = p.getString("night", "21:00");
        long snooze = p.getLong("nightSnooze", 0);
        long now = System.currentTimeMillis(), at;
        if (snooze > now) at = snooze;
        else {
            if (t == null || !t.matches("\\d{2}:\\d{2}")) return;
            Calendar c = Calendar.getInstance();
            c.set(Calendar.HOUR_OF_DAY, Integer.parseInt(t.substring(0, 2)));
            c.set(Calendar.MINUTE, Integer.parseInt(t.substring(3)));
            c.set(Calendar.SECOND, 0);
            c.set(Calendar.MILLISECOND, 0);
            if (c.getTimeInMillis() <= now + 30000) c.add(Calendar.DAY_OF_MONTH, 1);
            at = c.getTimeInMillis();
        }
        p.edit().putLong("nightAt", at).apply();
        am.setWindow(AlarmManager.RTC, at, 60000, pending(ctx));
    }

    static void snooze(Context ctx, int minutes) {
        ctx.getSharedPreferences("prism", Context.MODE_PRIVATE).edit().putLong("nightSnooze", System.currentTimeMillis() + minutes * 60000L).apply();
        schedule(ctx);
    }
}
