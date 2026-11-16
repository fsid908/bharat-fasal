import { CheckCircle2, Handshake, XCircle } from "lucide-react";

export default function OfferCard({
  offer,
  role,
  onStatus,
  onCounter,
  busy,
  getCommodityName,
  t,
}) {
  const statusClass = {
    accepted: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    countered: "bg-blue-50 text-blue-700",
    pending: "bg-yellow-50 text-yellow-700",
  }[offer.status];

  const counter = Number(offer.counterPrice || 0);

  const price =
    offer.status === "accepted" && offer.counterPrice != null
      ? counter
      : Number(offer.offeredPrice || 0);

  const total =
    offer.status === "accepted" && offer.counterPrice != null
      ? Number(offer.quantity || 0) * counter
      : Number(offer.totalAmount || 0);

  const counterTotal = Number(offer.quantity || 0) * counter;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-gray-900 capitalize">
              {getCommodityName(offer.commodityId, t)}
            </h3>

            <span
              className={`px-2 py-1 rounded-md text-[11px] font-semibold capitalize ${statusClass}`}
            >
              {offer.status}
            </span>
          </div>

          <p className="text-xs text-gray-500 mt-1">
            Offer ID: {offer.offerId}
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm text-gray-600">
            <span>
              {role === "seller" ? "Buyer" : "Seller"}:{" "}
              <strong className="text-gray-900">
                {role === "seller"
                  ? offer.buyerName || "Buyer"
                  : offer.sellerName || "Seller"}
              </strong>
            </span>

            <span>
              Quantity:{" "}
              <strong className="text-gray-900">
                {offer.quantity} Quintals
              </strong>
            </span>

            <span>
              {role === "seller" ? "Offered" : "Your Offer"}:{" "}
              <strong className="text-gray-900">
                ₹{price.toLocaleString("en-IN")}/q
              </strong>
            </span>

            {offer.counterPrice != null && (
              <span>
                Counter:{" "}
                <strong className="text-blue-700">
                  ₹{counter.toLocaleString("en-IN")}/q
                </strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
          <div className="text-left lg:text-right">
            <p className="text-xs text-gray-400">Total Amount</p>

            <p className="mt-1 text-lg font-bold text-green-700">
              ₹{total.toLocaleString("en-IN")}
            </p>

            {offer.status === "countered" && offer.counterPrice != null && (
              <p className="mt-1 text-xs font-semibold text-blue-700">
                Counter Total: ₹{counterTotal.toLocaleString("en-IN")}
              </p>
            )}
          </div>

          {role === "seller" && offer.status === "pending" && (
            <div className="flex flex-wrap gap-2">
              <button
                disabled={busy}
                onClick={() => onStatus(offer.offerId, "accepted")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                {busy ? "Updating..." : "Accept"}
              </button>

              <button
                disabled={busy}
                onClick={() => onStatus(offer.offerId, "rejected")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
              >
                <XCircle size={14} />
                Reject
              </button>

              <button
                disabled={busy}
                onClick={() => onCounter(offer)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50"
              >
                <Handshake size={14} />
                Counter
              </button>
            </div>
          )}

          {role === "buyer" && offer.status === "countered" && (
            <div className="flex flex-wrap gap-2">
              <button
                disabled={busy}
                onClick={() => onStatus(offer.offerId, "accepted")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                {busy ? "Updating..." : "Accept Counter"}
              </button>

              <button
                disabled={busy}
                onClick={() => onStatus(offer.offerId, "rejected")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
              >
                <XCircle size={14} />
                Reject Counter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
