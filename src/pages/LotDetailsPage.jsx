import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  MapPin,
  CalendarDays,
  Truck,
  UserRound,
  CheckCircle2,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function LotDetailsPage() {
  const { lotId } = useParams();
  const navigate = useNavigate();

  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // PURCHASE REQUEST STATE
  // =====================================================

  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState("");

  // =====================================================
  // FETCH LOT
  // =====================================================

  useEffect(() => {
    const fetchLot = async () => {
      try {
        const response = await fetch(`${API}/api/lots/${lotId}`);
        const data = await response.json();

        if (data.success) {
          setLot(data.lot);
        }
      } catch (error) {
        console.error("Failed to fetch lot:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLot();
  }, [lotId]);

  // =====================================================
  // REQUEST TO BUY
  // =====================================================

  const handleRequestToBuy = async () => {
  setRequestError("");

  const token = localStorage.getItem("bf_auth_token");

  if (!token) {
    setRequestError("Please login before requesting to buy.");
    return;
  }

  try {
    setRequestLoading(true);

    const response = await fetch(
      `${API}/api/purchase-requests`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lotId: lot.id,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      setRequestError(
        data.message || "Failed to send purchase request.",
      );
      return;
    }

    setRequestSent(true);

    console.log(
      "Purchase request created:",
      data.request,
    );
  } catch (error) {
    console.error("Request to buy error:", error);

    setRequestError(
      "Unable to connect to server. Please try again.",
    );
  } finally {
    setRequestLoading(false);
  }
};

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading lot details...
      </div>
    );
  }

  // =====================================================
  // LOT NOT FOUND
  // =====================================================

  if (!lot) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold text-gray-900">Lot not found</h2>

        <button
          onClick={() => navigate("/buyers")}
          className="mt-4 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* BACK */}

      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="mt-5 bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* HEADER */}

        <div className="p-5 sm:p-7 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <Package size={23} className="text-green-600" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 capitalize">
                    {lot.commodityId}
                  </h1>

                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    <CheckCircle2 size={12} />
                    {lot.status}
                  </span>
                </div>

                <p className="text-xs text-gray-400 mt-1">Lot ID: {lot.id}</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-2xl font-bold text-green-700">
                ₹{lot.expectedPrice}
              </p>

              <p className="text-xs text-gray-500">per quintal</p>
            </div>
          </div>
        </div>

        {/* DETAILS */}

        <div className="p-5 sm:p-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Info
              icon={<Package size={17} />}
              label="Quantity"
              value={`${lot.quantity} Quintals`}
            />

            <Info label="Grade" value={lot.grade} />

            <Info
              icon={<MapPin size={17} />}
              label="Pickup Location"
              value={lot.pickupLocation}
            />

            <Info
              icon={<CalendarDays size={17} />}
              label="Available From"
              value={formatDate(lot.availableDate)}
            />
          </div>

          {/* TRANSPORT + SELLER */}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <Truck size={20} className="text-gray-500" />

                <div>
                  <p className="text-xs text-gray-400">Transportation</p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {lot.transportation === "buyer"
                      ? "Buyer will arrange"
                      : "Seller will arrange"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <UserRound size={20} className="text-gray-500" />

                <div>
                  <p className="text-xs text-gray-400">Seller</p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {lot.sellerName || "Seller"}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {lot.sellerDistrict}, {lot.sellerState}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ERROR */}

          {requestError && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {requestError}
            </div>
          )}

          {/* SUCCESS */}

          {requestSent && (
            <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 mt-0.5" />

                <div>
                  <p className="font-semibold text-green-800">
                    Purchase Request Sent
                  </p>

                  <p className="text-sm text-green-700 mt-1">
                    Your request has been sent to the seller. You can wait for
                    the seller's response.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* REQUEST BUTTON */}

          <div className="mt-6 flex justify-end">
            {!requestSent && (
              <button
                type="button"
                onClick={handleRequestToBuy}
                disabled={requestLoading}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white ${
                  requestLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {requestLoading ? "Sending Request..." : "Request to Buy"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ icon, label, value }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}

        <p className="text-xs">{label}</p>
      </div>

      <p className="mt-2 text-sm font-semibold text-gray-900">{value || "—"}</p>
    </div>
  );
}
