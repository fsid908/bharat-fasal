import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Settings, User, Sprout, MapPin, Phone, ShieldCheck, Landmark,
  WalletCards, Bell, BarChart3, MessageCircle, Globe, ChevronRight,
  CircleHelp, Mail, Info, LogOut, Leaf, Truck
} from "lucide-react";
import SettingsLanguageSelector from "../components/SettingsLanguageSelector";

const VERIFICATION_API =
  "https://bharat-fasal.onrender.com/api/verification/farmer";
const VERIFICATION_STATUS_API =
  "https://bharat-fasal.onrender.com/api/verification/me";

const cardClass =
  "bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden";

const inputClass =
  "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-500";

const getToken = () => localStorage.getItem("bf_auth_token");

function Card({ icon: Icon, color = "green", title, subtitle, children }) {
  const colors = {
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-yellow-50 text-yellow-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-500",
    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <section className={cardClass}>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={19} />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Modal({ title, subtitle, onClose, children, className = "max-w-md" }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className={`w-full ${className} bg-white rounded-2xl shadow-xl`}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm">
        {value}
      </div>
    </div>
  );
}

function PaymentRow({ icon: Icon, title, subtitle, onClick, border = true }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between py-4 text-left ${
        border ? "border-b border-gray-100" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-gray-500" />
        <div>
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <ChevronRight size={17} className="text-gray-400" />
    </button>
  );
}

function Status({ status, onVerify }) {
  if (status === "verified")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
        <ShieldCheck size={13} /> Verified Farmer
      </span>
    );

  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
        <ShieldCheck size={13} /> Verification Pending
      </span>
    );

  if (status === "rejected")
    return <span className="text-xs font-semibold text-red-600">Verification Rejected</span>;

  return (
    <button
      type="button"
      onClick={onVerify}
      className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-800"
    >
      Verify your identity <ChevronRight size={13} />
    </button>
  );
}

function VerificationAction({ status, onVerify }) {
  if (status === "verified")
    return (
      <span className="shrink-0 text-xs font-semibold text-green-600 flex items-center gap-1">
        <ShieldCheck size={14} /> Verified
      </span>
    );

  if (status === "pending")
    return <span className="shrink-0 text-xs font-semibold text-amber-600">Pending</span>;

  return (
    <button
      type="button"
      onClick={onVerify}
      className={`shrink-0 text-xs font-semibold ${
        status === "rejected" ? "text-red-600" : "text-green-700"
      }`}
    >
      {status === "rejected" ? "Re-verify" : "Verify Now"}
      <ChevronRight size={13} className="inline ml-1" />
    </button>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
      />
      <div className="w-11 h-6 rounded-full bg-gray-300 peer-checked:bg-green-600 transition" />
      <div className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
    </label>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
        required
      />
    </div>
  );
}

export default function FarmerSettingsPage({ user, onLogout }) {
  const { t, i18n } = useTranslation();

  const [showLang, setShowLang] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [notifications, setNotifications] = useState({
    prices: true,
    buyers: true,
    payments: true,
  });

  const [verificationStatus, setVerificationStatus] = useState(
    () => localStorage.getItem("bf_verification_status") || "not_verified"
  );

  const [verificationForm, setVerificationForm] = useState({
    fullName: user?.name || "",
    idType: "",
    idReference: "",
  });

  useEffect(() => {
    const loadVerification = async () => {
      const token = getToken();
      if (!token) return;

      try {
        const response = await fetch(VERIFICATION_STATUS_API, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const data = await response.json();
        const status = data.verification?.status;

        if (status) {
          setVerificationStatus(status);
          localStorage.setItem("bf_verification_status", status);
        }
      } catch (error) {
        console.error("Verification status error:", error);
      }
    };

    loadVerification();
  }, []);

  const updateForm = (key, value) =>
    setVerificationForm((prev) => ({ ...prev, [key]: value }));

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();

    const { fullName, idType, idReference } = verificationForm;
    if (!fullName.trim() || !idType || !idReference.trim()) return;

    setSubmitting(true);

    try {
      const response = await fetch(VERIFICATION_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          idType,
          idReference: idReference.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.message || "Verification failed");

      setVerificationStatus(data.verification?.status || "pending");
      localStorage.setItem(
        "bf_verification_status",
        data.verification?.status || "pending"
      );
      setShowVerification(false);
    } catch (error) {
      console.error("Farmer verification error:", error);
      alert(error.message || "Unable to submit verification");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleNotification = (key) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    document.documentElement.setAttribute("dir", lang === "ur" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  };

  const verify = () => setShowVerification(true);

  const notificationItems = [
    ["prices", "Market Price Alerts", BarChart3],
    ["buyers", "Buyer Messages", MessageCircle],
    ["payments", "Payment Updates", WalletCards],
  ];

  const farmItems = [
    ["Main Crops", "Wheat, Rice, Maize"],
    ["Typical Lot Size", "50–200 Quintals"],
    ["Preferred Quality", "A / Premium"],
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* HEADER */}
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
            <Settings size={22} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("settings")}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your farmer account and preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

          {/* FARMER PROFILE */}
          <Card
            icon={User}
            title="Farmer Profile"
            subtitle="Your personal and farming information"
          >
            <div className="p-5">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                  <User size={38} strokeWidth={1.8} className="text-green-600" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 truncate">
                    {user?.name || "Farmer"}
                  </h3>

                  <div className="mt-1.5">
                    <Status status={verificationStatus} onVerify={verify} />
                  </div>

                  {user?.phone && (
                    <p className="flex items-center gap-2 text-sm text-gray-500 mt-1.5">
                      <Phone size={15} /> {user.phone}
                    </p>
                  )}

                  <p className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <MapPin size={15} /> {user?.location || "India"}
                  </p>

                  <p className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Sprout size={15} /> Farmer
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowProfile(true)}
                className="w-full mt-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Manage Profile
              </button>
            </div>
          </Card>

          {/* VERIFICATION */}
          <Card
            icon={ShieldCheck}
            title="Farmer Verification"
            subtitle="Verify your identity for trusted transactions"
          >
            <div className="px-5">
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Mobile Number
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {user?.phone || "Not added"}
                  </p>
                </div>
                <span className="text-xs font-semibold text-green-600">
                  ✓ Verified
                </span>
              </div>

              <div className="flex items-center justify-between py-4 border-b border-gray-100 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    Identity Verification
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Government identity verification
                  </p>
                </div>
                <VerificationAction
                  status={verificationStatus}
                  onVerify={verify}
                />
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Bank Verification
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Required for receiving payments
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBank(true)}
                  className="text-xs font-semibold text-green-700"
                >
                  Manage <ChevronRight size={13} className="inline ml-1" />
                </button>
              </div>
            </div>
          </Card>

          {/* FARM & SELLING */}
          <Card
            icon={Leaf}
            title="Farm & Selling Preferences"
            subtitle="Manage your crop and selling preferences"
          >
            <div className="px-5">
              {farmItems.map(([label, value], index) => (
                <div
                  key={label}
                  className={`py-4 ${
                    index !== farmItems.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {value}
                  </p>
                </div>
              ))}

              <div className="py-4">
                <div className="flex items-center gap-2">
                  <Truck size={15} className="text-gray-400" />
                  <p className="text-xs text-gray-500">Transportation</p>
                </div>
                <p className="text-sm font-semibold text-gray-800 mt-1">
                  Seller will arrange transportation
                </p>
              </div>
            </div>

            <div className="px-5 pb-5">
              <button
                type="button"
                className="w-full py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Manage Selling Preferences
              </button>
            </div>
          </Card>

          {/* PAYMENTS */}
          <Card
            icon={Landmark}
            color="purple"
            title="Payments & Bank"
            subtitle="Manage your payment settlement"
          >
            <div className="px-5">
              <PaymentRow
                icon={WalletCards}
                title="Bank Account"
                subtitle="Bank account not added"
                onClick={() => setShowBank(true)}
              />
              <PaymentRow
                icon={ShieldCheck}
                title="Payment Settlement"
                subtitle="Track payments from your sales"
              />
              <PaymentRow
                icon={WalletCards}
                title="Payment History"
                subtitle="View completed settlements"
                border={false}
              />
            </div>
          </Card>

          {/* NOTIFICATIONS */}
          <Card
            icon={Bell}
            color="yellow"
            title="Notifications"
            subtitle="Choose what updates you receive"
          >
            <div className="px-5">
              {notificationItems.map(([key, label, Icon], index) => (
                <div
                  key={key}
                  className={`flex items-center justify-between py-4 ${
                    index !== notificationItems.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-gray-500" />
                    <span className="text-sm font-semibold text-gray-800">
                      {label}
                    </span>
                  </div>
                  <Toggle
                    checked={notifications[key]}
                    onChange={() => toggleNotification(key)}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* LANGUAGE */}
          <section className={cardClass}>
            <button
              type="button"
              onClick={() => setShowLang(!showLang)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Globe size={19} />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Language</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Change Language
                  </p>
                </div>
              </div>
              <ChevronRight
                size={20}
                className={`text-gray-400 transition ${
                  showLang ? "rotate-90" : ""
                }`}
              />
            </button>

            {showLang && (
              <div className="px-5 pb-5 pt-2 border-t border-gray-100">
                <SettingsLanguageSelector
                  selectedLang={i18n.language}
                  onSelect={handleLanguageChange}
                />
              </div>
            )}
          </section>

          {/* HELP */}
          <Card
            icon={CircleHelp}
            color="red"
            title="Help & Support"
            subtitle="Get help with your farmer account"
          >
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone size={17} className="text-gray-400" />
                <span>Helpline: +91 9999999990</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Mail size={17} className="text-gray-400" />
                <span>support@bharatfasal.in</span>
              </div>
            </div>
          </Card>

          {/* ABOUT */}
          <Card
            icon={Info}
            color="gray"
            title="About"
            subtitle="Bharat Fasal Version 1.0.0"
          />

          {/* LOGOUT */}
          <button
            type="button"
            onClick={onLogout}
            className="lg:col-span-2 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-200 bg-white text-red-600 font-semibold hover:bg-red-50"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* PROFILE MODAL */}
      {showProfile && (
        <Modal
          title="Farmer Profile"
          subtitle="Your account information"
          onClose={() => setShowProfile(false)}
        >
          <div className="p-5 space-y-4">
            <InfoRow label="Name" value={user?.name || "Farmer"} />
            <InfoRow label="Mobile Number" value={user?.phone || "Not available"} />
            <InfoRow label="Location" value={user?.location || "India"} />
          </div>

          <div className="px-5 pb-5">
            <button
              type="button"
              onClick={() => setShowProfile(false)}
              className="w-full py-2.5 rounded-lg bg-green-600 text-white font-semibold"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* VERIFICATION MODAL */}
      {showVerification && (
        <Modal
          title="Farmer Verification"
          subtitle="Verify your identity for trusted transactions"
          onClose={() => setShowVerification(false)}
          className="max-w-md max-h-[90vh] overflow-y-auto"
        >
          <form onSubmit={handleVerificationSubmit}>
            <div className="p-5 space-y-4">
              <Field
                label="Full Name"
                value={verificationForm.fullName}
                onChange={(value) => updateForm("fullName", value)}
                placeholder="Enter your full name"
              />

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Government ID Type
                </label>
                <select
                  value={verificationForm.idType}
                  onChange={(e) => updateForm("idType", e.target.value)}
                  className={`${inputClass} bg-white`}
                  required
                >
                  <option value="">Select ID type</option>
                  <option value="aadhaar">Aadhaar</option>
                  <option value="voter_id">Voter ID</option>
                  <option value="driving_license">Driving Licence</option>
                  <option value="other">Other Government ID</option>
                </select>
              </div>

              <div>
                <Field
                  label="ID Reference"
                  value={verificationForm.idReference}
                  onChange={(value) => updateForm("idReference", value)}
                  placeholder="Enter ID reference"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Demo flow only. Do not enter sensitive real ID numbers.
                </p>
              </div>

              <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-xs text-green-800">
                Your verification request will be submitted for review.
              </div>
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button
                type="button"
                onClick={() => setShowVerification(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit for Verification"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* BANK MODAL */}
      {showBank && (
        <Modal
          title="Bank Account"
          subtitle="Add account for payment settlement"
          onClose={() => setShowBank(false)}
        >
          <div className="p-5 space-y-4">
            <input
              type="text"
              placeholder="Account Holder Name"
              className={inputClass}
            />
            <input
              type="text"
              placeholder="Account Number"
              className={inputClass}
            />
            <input
              type="text"
              placeholder="IFSC Code"
              className={`${inputClass} uppercase`}
            />
          </div>

          <div className="flex gap-3 px-5 pb-5">
            <button
              type="button"
              onClick={() => setShowBank(false)}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => setShowBank(false)}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold"
            >
              Save Details
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}