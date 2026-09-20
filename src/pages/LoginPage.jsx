import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Volume2,
  ArrowRight,
  Globe,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage({ onLogin }) {
  const { t, i18n } = useTranslation();

  // ================================
  // FORM STATES
  // ================================

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const currentLanguage = i18n.language;

  // ================================
  // LANGUAGE
  // ================================

  const handleLanguageChange = (e) => {
    const lang = e.target.value;

    i18n.changeLanguage(lang);

    document.documentElement.setAttribute("dir", lang === "ur" ? "rtl" : "ltr");

    document.documentElement.setAttribute("lang", lang);
  };

  // ================================
  // PASSWORD LOGIN
  // ================================

  const handlePasswordLogin = async () => {
  if (phone.length !== 10) {
    alert("Please enter a valid 10 digit mobile number");
    return;
  }

  if (password.length < 6) {
    alert("Please enter a valid password");
    return;
  }

  try {
    const response = await fetch("https://bharat-fasal.onrender.com/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mobile: phone,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(data.message || "Login failed");
      return;
    }

    // Save JWT token
    localStorage.setItem("bf_auth_token", data.token);

    // Create user object for existing frontend flow
    const user = {
      id: data.user.id,
      name: data.user.name,
      companyName: data.user.organizationName || "",
      email: data.user.email || "",
      role: data.user.role,
      location: data.user.village || "",
      phone: data.user.mobile,
      district: data.user.district || "",
      state: data.user.state || "",
    };

    console.log("LOGIN USER:", user);

    // Existing dashboard/login flow
    onLogin(data.user.role, user);

  } catch (error) {
    console.error("Login error:", error);
    alert("Unable to connect to server. Please make sure backend is running.");
  }
};
  // ================================
  // FORGOT PASSWORD - SEND OTP
  // ================================

  const handleSendOtp = async () => {
  if (phone.length !== 10) {
    alert("Please enter a valid 10 digit mobile number");
    return;
  }

  try {
    const response = await fetch(
      "https://bharat-fasal.onrender.com/api/auth/forgot-password/send-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile: phone,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(data.message || "Unable to send OTP");
      return;
    }

    setOtpSent(true);
    setOtp("");

    alert("OTP generated successfully. Check the backend terminal.");
  } catch (error) {
    console.error("Send OTP error:", error);
    alert("Unable to connect to server. Please try again.");
  }
};

  // ================================
  // FORGOT PASSWORD - RESET
  // ================================

  const handleVerify = async () => {
  if (otp.length !== 4) {
    alert("Please enter 4 digit OTP");
    return;
  }

  if (newPassword.length < 6) {
    alert("New password must be at least 6 characters");
    return;
  }

  try {
    // First verify OTP
    const verifyResponse = await fetch(
      "https://bharat-fasal.onrender.com/api/auth/forgot-password/verify-otp",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile: phone,
          otp: otp,
        }),
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyResponse.ok || !verifyData.success) {
      alert(verifyData.message || "Invalid OTP");
      return;
    }

    // Reset password
    const resetResponse = await fetch(
      "https://bharat-fasal.onrender.com/api/auth/forgot-password/reset",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mobile: phone,
          otp: otp,
          newPassword: newPassword,
        }),
      }
    );

    const resetData = await resetResponse.json();

    if (!resetResponse.ok || !resetData.success) {
      alert(resetData.message || "Unable to reset password");
      return;
    }

    alert("Password reset successfully. Please login with your new password.");

    setOtpSent(false);
    setOtp("");
    setNewPassword("");
    setShowNewPassword(false);
    setPassword("");

  } catch (error) {
    console.error("Password reset error:", error);
    alert("Unable to connect to server. Please try again.");
  }
};

  // ================================
  // VOICE
  // ================================

  const speak = () => {
    if (!("speechSynthesis" in window)) return;

    const languageVoiceMap = {
      hi: "hi-IN",
      en: "en-IN",
      ur: "ur-PK",
      ta: "ta-IN",
      te: "te-IN",
      bn: "bn-IN",
      mr: "mr-IN",
      gu: "gu-IN",
      kn: "kn-IN",
      pa: "pa-IN",
      hinglish: "en-IN",
    };

    const voiceLanguage = languageVoiceMap[currentLanguage] || "hi-IN";

    const text = forgotPassword
      ? currentLanguage === "hi"
        ? "अपना मोबाइल नंबर डालें। ओटीपी से सत्यापन करें और नया पासवर्ड बनाएं।"
        : "Enter your mobile number, verify with OTP, and create a new password."
      : t("login_instruction", {
          defaultValue:
            currentLanguage === "hi"
              ? "अपना मोबाइल नंबर और पासवर्ड डालें। फिर लॉगिन करें।"
              : "Enter your mobile number and password. Then login.",
        });

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = voiceLanguage;
    speech.rate = 0.85;

    window.speechSynthesis.speak(speech);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-8">
      {/* ================================
          LANGUAGE
      ================================= */}

      <div className="absolute top-5 right-5 z-30">
        <div className="relative">
          <Globe
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-700 pointer-events-none"
          />

          <select
            value={currentLanguage}
            onChange={handleLanguageChange}
            className="appearance-none bg-white/90 backdrop-blur-md border border-white/70 text-gray-700 rounded-xl pl-9 pr-9 py-2.5 text-sm font-semibold shadow-lg outline-none cursor-pointer hover:bg-white transition"
          >
            <option value="hi">हिन्दी</option>
            <option value="en">English</option>
            <option value="ur">اردو</option>
            <option value="ta">தமிழ்</option>
            <option value="te">తెలుగు</option>
            <option value="bn">বাংলা</option>
            <option value="mr">मराठी</option>
            <option value="gu">ગુજરાતી</option>
            <option value="kn">ಕನ್ನಡ</option>
            <option value="pa">ਪੰਜਾਬੀ</option>
            <option value="hinglish">Hinglish</option>
          </select>
        </div>
      </div>

      {/* ================================
          BACKGROUND
      ================================= */}

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85')",
        }}
      />

      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 bg-primary-950/15" />

      {/* ================================
          MAIN
      ================================= */}

      <div className="relative z-10 w-full max-w-md">
        {/* BRAND */}

        <div className="text-center text-white mb-6">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-white/95 flex items-center justify-center shadow-xl mb-4">
            <img
              src="/images/bharat-fasal-logo.png"
              alt="Bharat Fasal"
              className="w-12 h-12 object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">{t("app_name")}</h1>

          <p className="text-white/85 mt-1">{t("tagline")}</p>
        </div>

        {/* LOGIN CARD */}

        <div className="bg-white/75 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl p-5 sm:p-7">
          {!otpSent ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("login")}
                </h2>

                <p className="text-gray-500 mt-1 text-sm">
                  {t("phone_number")}
                </p>
              </div>

              {/* PHONE */}

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  {t("phone_number")}
                </label>

                <div className="flex gap-2">
                  <div className="h-12 px-3 flex items-center bg-white/80 border border-gray-200 rounded-xl text-gray-700 font-semibold">
                    +91
                  </div>

                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder={t("enter_phone")}
                    className="flex-1 h-12 px-4 rounded-xl border border-gray-200 bg-white/80 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                    maxLength={10}
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-12 pl-10 pr-12 rounded-xl border border-gray-200 bg-white/80 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* LOGIN */}

              <button
                type="button"
                onClick={handlePasswordLogin}
                disabled={phone.length !== 10 || password.length < 6}
                className="w-full mt-5 h-12 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {t("login")}
                <ArrowRight size={19} />
              </button>

              {/* FORGOT PASSWORD */}

              <button
                type="button"
                onClick={handleSendOtp}
                className="w-full mt-3 text-sm font-medium text-primary-700 hover:text-primary-800"
              >
                Forgot Password?
              </button>

              {/* VOICE */}

              <button
                type="button"
                onClick={speak}
                className="w-full mt-3 h-10 rounded-lg text-sm font-medium text-gray-600 hover:text-primary-700 hover:bg-white/60 flex items-center justify-center gap-2"
              >
                <Volume2 size={17} />

                {t("listen", {
                  defaultValue:
                    currentLanguage === "hi"
                      ? "सुनकर समझें"
                      : "Listen to instructions",
                })}
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Forgot Password
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  {currentLanguage === "hi"
                    ? `OTP +91 ${phone} पर भेजा गया`
                    : `OTP sent to +91 ${phone}`}
                </p>
              </div>

              {/* DEMO OTP */}

              {/* <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 mb-5 text-center"> */}

              {/* <p className="text-xs text-primary-600">
                  Demo OTP
                </p>

                <p className="text-xl font-bold tracking-[0.35em] text-primary-800">
                  1234
                </p> */}

              {/* </div> */}

              {/* OTP */}

              <div className="flex justify-center gap-2 mb-5">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");

                      const newOtp = otp.split("");

                      newOtp[i] = val;

                      setOtp(newOtp.join(""));

                      if (val && i < 3) {
                        document.getElementById(`otp-${i + 1}`)?.focus();
                      }
                    }}
                    className="w-14 h-14 text-center text-2xl font-bold rounded-xl border border-gray-200 bg-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                ))}
              </div>

              {/* NEW PASSWORD */}

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  New Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full h-12 pl-10 pr-12 rounded-xl border border-gray-200 bg-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />

                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleVerify}
                disabled={otp.length !== 4 || newPassword.length < 6}
                className="w-full h-12 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                {t("verify")}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setNewPassword("");
                  setShowNewPassword(false);
                }}
                className="w-full mt-3 h-10 text-sm font-medium text-primary-700 hover:bg-primary-50 rounded-lg"
              >
                ← {t("back")}
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-white/75 mt-5">
          Bharat Fasal · Digital agriculture marketplace
        </p>
      </div>
    </div>
  );
}
