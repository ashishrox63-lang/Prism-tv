# Prism TV Home

A new home screen and screensaver for your OnePlus TV (Android TV 10), designed in an Apple style with motion throughout.

**What it does**

- **Three layouts:** Shelf, Glass (a magnifying dock) and a 3D Carousel. Light and dark switch with the time of day, and the wallpaper changes between day and night photos.
- **Pages:** Home, Today (weather, air quality, sun and moon, calendar, holidays, news), Watch, Listen, any pages you add, and All apps.
- **Your TV, your way:** profiles for each family member, folders, HDMI inputs as tiles with their own names, and a Home row that learns which apps you open at which time of day.
- **Search and voice:** search across apps, or say "Kesariya on YouTube", "switch to set-top box" or "good night".
- **Control Centre:** now playing (Apple Music, Spotify and others), network, Bluetooth, inputs, layout, screensaver, phone remote and sleep.
- **Screensaver:** works as a real Android screensaver. It rotates through a large clock, your family photos, a live Hyderabad weather scene for the real time of day, public-domain art, a calendar and family notes. It moves slightly every minute to protect the screen.
- **Night mode:** at 9:00 pm (you can change the time) Prism shows a one-minute countdown, then switches the TV off. You can snooze for 30 minutes or keep watching.
- **Phone remote:** scan a QR code on the TV. Your phone becomes a remote, touchpad and keyboard. From it you can send photos, write family notes, rearrange Home, change the look, and set up profiles, the calendar, news and updates.
- **Under the hood:** interface sounds, self-update, and offline use (it shows the last saved weather and news). Safety net: if Prism crashes three times in three minutes, the TV's original home screen opens instead.

```
prism/
  web/       The home screen and screensaver. Open web/index.html in Chrome to try it.
  phone/     The phone remote page. The TV serves it to your phone.
  android/   The Android TV app that runs it all on the TV.
  .github/   An automatic build that turns this folder into an installable APK on GitHub.
```

---

## 1. Get the APK (the file you install on the TV)

Pick one route.

### Route A: GitHub builds it for you (recommended, nothing to install)

1. Sign in at github.com and create a new repository named, for example, `prism-tv`.
   - Make it **public** if you want the TV to update itself from GitHub (step 6). Nothing private is in this folder.
   - Make it **private** if you prefer. You will then install updates by uploading the APK from your phone instead.
2. On the new repository page, click **uploading an existing file**. Drag in everything inside this `prism` folder, then click **Commit changes**.
3. Check that `.github/workflows/build.yml` is there. Folders whose names start with a dot are sometimes skipped. If it is missing:
   - Click **Add file → Create new file**.
   - Type `.github/workflows/build.yml` as the name.
   - Paste in the contents of that file from this folder, then commit.
4. Open the **Actions** tab. A run called **Build Prism APK** starts by itself (if it doesn't, click **Run workflow**). It takes about 4 minutes.
5. When it shows a green tick, go to the repository's **Releases** (right-hand side of the main page) and open **latest**. Download **prism.apk**.
6. Self-update link: `https://github.com/<your user name>/prism-tv/releases/download/latest/version.json`. You will paste this into the phone remote later.

Every time you change a file in the repository, GitHub builds a new version and replaces the **latest** release.

### Route B: Android Studio

1. Install Android Studio. Click **File → Open** and choose the `android` folder.
2. Wait for it to sync, then click **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
3. The APK is at `android/app/build/outputs/apk/debug/app-debug.apk`.

Both routes sign the app with the same key (`android/app/prism-tv.jks`). This means later builds install over earlier ones and keep your settings.

---

## 2. Install it on the TV

1. Allow installs from outside the Play Store. On the TV, go to **Settings → Device Preferences → Security & restrictions → Unknown sources**. Turn it on for the app you will use to open the APK in step 2.
2. Get the APK onto the TV. Use whichever is easiest:
   - **Send Files to TV** (free on the Play Store). Install it on your phone and on the TV, send `prism.apk`, then open it on the TV.
   - A USB pen drive and a file manager app on the TV.
   - adb, if you use it: run `adb connect <TV IP address>`, then `adb install -r prism.apk`.
3. Open **Prism** from the TV's Apps row. The first launch plays a short opening animation.

## 3. Make the Home button open Prism

Start with option 1. Only move down the list if it doesn't work.

1. **Press Home.** If the TV asks which app to use, choose **Prism**, then **Always**. Some Android TV builds don't ask.
2. **Button Mapper** (by flar2, on the Play Store). Set the Home button to open Prism. It needs Accessibility permission. Uninstalling Button Mapper undoes everything.
3. **Turn off the stock home screen with adb.** Only do this if you are comfortable with adb.
   - Find the stock home screen's package name: `adb shell cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME`
   - Turn it off: `adb shell pm disable-user --user 0 <that package>`
   - To undo: `adb shell pm enable <that package>`
   - Never uninstall the stock home screen. On some firmware, turning it off also hides OxygenPlay or voice search shortcuts. Write the undo command down before you start.

You can always open the stock home screen from **Customize → This TV → Open the TV's own home screen**.

---

## 4. One-time setup (each takes under a minute)

Open **Customize** (the gear at the top right). Its last section, **This TV**, lists each item below with a tick when it's done. Selecting an item takes you to the right TV setting.

| Feature | What to do on the TV |
| --- | --- |
| **Prism screensaver** | **Settings → Device Preferences → Screen saver → Prism**. Set **When to start** to the delay you want. |
| **9 pm switch-off, and Back/Home from the phone** | **Settings → Device Preferences → Accessibility → Prism → On**. Prism uses this only to switch the TV to standby and to press Back and Home for you. Without it, Prism blanks the screen at night instead. |
| **Typing from the phone into other apps** (Netflix, YouTube, sign-in boxes) | **Settings → Device Preferences → Keyboard → Manage keyboards**. Turn on **Prism Keyboard**, then choose it as the **Current keyboard**. |
| **Now playing (Apple Music, Spotify)** | Android TV has no on-screen switch for this, so it needs one adb command (see below). Without it, Control Centre simply hides the now playing card. |
| **Self-update** | The first time you update, Prism asks you to allow it to install apps. Turn that on. |

Command for now playing (connect with `adb connect <TV IP address>` first):

```
adb shell cmd notification allow_listener app.prism.tvhome/app.prism.tvhome.NowPlaying
```

### Pair your phone

1. On the TV, press **Up** and open **Control Centre** (the toggles icon). Choose **Phone remote**.
2. Scan the QR code with your phone's camera. The phone and TV must be on the same Wi-Fi.
3. Add the page to your home screen (Safari: **Share → Add to Home Screen**) so it opens like an app.

The QR code includes a private pairing code. Anyone without it can't control the TV.

### On the phone remote, in Settings

- **Weather place:** Hyderabad is already set. Type another city to change it.
- **Google Calendar:**
  1. On a computer, open Google Calendar **Settings**, then your calendar.
  2. Copy **Secret address in iCal format**.
  3. Paste it into the phone remote. Holidays in India appear automatically.
- **News:** choose The Hindu (Hyderabad), India headlines and BBC.
- **Update link:** paste the `version.json` link from Route A, step 6. Prism checks it once a day and tells you when a new version is ready. Install it from **Customize → This TV**. To update by hand, upload a new `prism.apk` from the phone instead.
- **Profiles, folders, pages, inputs, screensaver scenes and the night time** are all here too.

---

## Using it

| Remote | What happens |
| --- | --- |
| Left / Right | Move along the apps |
| Up | The tabs (Home, Today, Watch, Listen, All apps), then Search, Voice, Control Centre, Customize and Profiles |
| OK | Open the selected app, input or folder |
| Hold OK (or Menu) | Options: move, add to Home, add to a folder, remove, app info |
| Back | Close a panel, then return to the first app |
| Home | Return to Prism. It opens on Home. |
| Any button during the screensaver | Return to where you were |

**Folders:** hold OK on an app and choose **Add to folder**. **Inputs:** open Control Centre → **Inputs**, then hold OK on an input to pin it to Home. Rename inputs from the phone (for example, "Set-top box" on "HDMI 1").

**Customize** sets the profile's layout, appearance, wallpaper, tile style, and which page Prism opens on. It also sets motion (**Lite** if the TV feels slow), interface sounds, the clock, screensaver scenes and timing, and the night switch-off time. Settings save as you change them.

---

## Changing the design

Everything you see lives in `web/`. Edit it, check it in Chrome by opening `web/index.html`, then rebuild the APK (with Route A, just upload the changed file to GitHub). The Android build copies `web/` and `phone/` into the app automatically.

The design rules that keep it fast on a TV:

- Only `transform` and `opacity` animate.
- There is no live blur. The glass effect uses pre-blurred copies of each photo.
- Colours are calculated in JavaScript instead of with newer CSS features that older TV browsers lack.

## What has and hasn't been tested

**Tested in Chrome at 1920×1080 against a simulated TV:**

- every layout in light and dark
- all pages, panels, folders, profiles, inputs, search and voice commands
- Control Centre with now playing
- every screensaver scene
- the night countdown
- the phone remote

**Compiled:** all the Android code compiles against the Android SDK.

**Not yet tried on a real OnePlus TV.** These parts depend on your TV's firmware, and are the most likely to need adjusting:

- Whether the Accessibility "lock screen" action puts the TV into standby. If it doesn't, Prism blanks the screen and you switch off with the remote.
- Opening an HDMI input directly from a tile. If it doesn't work, the tile opens the TV's input list.
- Search landing directly inside Netflix and YouTube. Otherwise the app opens on its own search.
- How smooth **Full** motion feels on your model. **Lite** is chosen automatically on TVs with little memory.

See `NOTICES.md` for credits.
