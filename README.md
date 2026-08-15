# SmartHealth Platform

This monorepo contains the entire SmartHealth platform:
1. **Web Dashboard (`/web`)**: A React/Vite application for hospital admins.
2. **Mobile App (`/mobile`)**: A Flutter application for ASHA workers in the field.

---

## 🖥️ Running the Web Dashboard (Next.js)

The web dashboard is a consolidated Command Center built using Next.js (App Router), Tailwind CSS, and Shadcn/UI.

Open a terminal and run:

```bash
cd C:\Users\shwet\OneDrive\Desktop\SmartHealth\web
npm run dev
```
- The dashboard will be available at: **http://localhost:3000**

---

## 📱 Running the Mobile App (Flutter)

The mobile app is built in Flutter and uses mock offline services so you don't need a backend to test the UI flow.

Open a **separate terminal** and run:

**To run in a Web Browser (Chrome):**
```bash
cd C:\Users\shwet\OneDrive\Desktop\SmartHealth\mobile
flutter run -d chrome
```

**To run on a physical Android device:**
1. Ensure your phone has Developer Options and USB Debugging enabled.
2. Connect your phone via USB.
3. Run the following:
```bash
cd C:\Users\shwet\OneDrive\Desktop\SmartHealth\mobile
flutter run
```
*(When prompted, type the number corresponding to your connected phone).*

---

### Tips
- You can leave both terminal windows open side-by-side to run both apps simultaneously!
- Any changes to `shared/` dictate the exact risk colors shared across *both* platforms.
