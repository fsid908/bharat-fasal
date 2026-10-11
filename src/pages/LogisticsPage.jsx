import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { warehouses, transportOptions } from "../data/mockLogistics";
import { formatCurrency } from "../utils/formatters";

export default function LogisticsPage() {
  const { t } = useTranslation();
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [tab, setTab] = useState("orders");
  const [calcQty, setCalcQty] = useState(50);
  const [calcDays, setCalcDays] = useState(30);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    orderId: "",
    pickupLocation: "",
    deliveryLocation: "",
    transporterName: "",
    transporterPhone: "",
    scheduledDate: "",
    expectedDelivery: "",
    estimatedTransportCost: "",
    notes: "",
  });

  const updateForm = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    setError("");

    try {
      const token = localStorage.getItem("bf_auth_token");

      if (!token) {
        throw new Error("Please log in first.");
      }

      const response = await fetch(`${API}/api/orders/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load orders.");
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setError(err.message || "Unable to load orders.");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [API]);

  const handleCreateLogistics = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!form.orderId) {
      setError("Please select an order.");
      return;
    }

    if (!form.pickupLocation.trim() || !form.deliveryLocation.trim()) {
      setError("Pickup and delivery locations are required.");
      return;
    }

    const cost = Number(form.estimatedTransportCost);

    if (
      form.estimatedTransportCost === "" ||
      !Number.isFinite(cost) ||
      cost < 0
    ) {
      setError("Enter a valid transportation cost.");
      return;
    }

    if (!form.expectedDelivery) {
      setError("Please enter the expected delivery date.");
      return;
    }

    if (form.scheduledDate && form.expectedDelivery < form.scheduledDate) {
      setError("Expected delivery cannot be before the scheduled date.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("bf_auth_token");

      if (!token) {
        throw new Error("Please log in again.");
      }

      // Check whether logistics already exists for this order
      const checkResponse = await fetch(
        `${API}/api/logistics/${encodeURIComponent(form.orderId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const responseText = await checkResponse.text();

      let existingData;

      try {
        existingData = JSON.parse(responseText);
      } catch {
        throw new Error(
          `API returned HTML instead of JSON. Check the API URL: ${API}/api/logistics/${form.orderId}`,
        );
      }

      let response;

      const payload = {
        pickupLocation: form.pickupLocation.trim(),
        deliveryLocation: form.deliveryLocation.trim(),
        transporterName: form.transporterName.trim(),
        transporterPhone: form.transporterPhone.trim(),
        scheduledDate: form.scheduledDate || null,
        expectedDelivery: form.expectedDelivery,
        estimatedTransportCost: cost,
        notes: form.notes.trim(),
      };

      if (checkResponse.ok && existingData.success && existingData.logistics) {
        // Existing logistics: update the existing record
        response = await fetch(
          `${API}/api/logistics/${encodeURIComponent(existingData.logistics.logisticsId)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          },
        );
      } else if (checkResponse.status === 404) {
        // No logistics record: create a new one
        response = await fetch(
          `${API}/api/logistics/${encodeURIComponent(form.orderId)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          },
        );
      } else {
        throw new Error(
          existingData.message || "Unable to check existing logistics.",
        );
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save logistics.");
      }

      setMessage(data.message || "Logistics saved successfully.");

      setForm({
        orderId: "",
        pickupLocation: "",
        deliveryLocation: "",
        transporterName: "",
        transporterPhone: "",
        scheduledDate: "",
        expectedDelivery: "",
        estimatedTransportCost: "",
        notes: "",
      });

      await fetchOrders();
    } catch (err) {
      setError(err.message || "Unable to save logistics.");
    } finally {
      setSaving(false);
    }
  };

  const selectedOrder = orders.find((order) => order.orderId === form.orderId);

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">🚚 {t("logistics")}</h2>

      {/* MAIN TABS */}
      <div className="flex flex-wrap rounded-xl overflow-hidden border border-gray-200">
        <button
          type="button"
          onClick={() => setTab("orders")}
          className={`flex-1 min-w-28 py-3 px-2 font-semibold ${
            tab === "orders"
              ? "bg-primary-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          Order Logistics
        </button>

        <button
          type="button"
          onClick={() => setTab("storage")}
          className={`flex-1 min-w-28 py-3 px-2 font-semibold ${
            tab === "storage"
              ? "bg-primary-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          🏗️ {t("nearby_warehouses")}
        </button>

        <button
          type="button"
          onClick={() => setTab("transport")}
          className={`flex-1 min-w-28 py-3 px-2 font-semibold ${
            tab === "transport"
              ? "bg-primary-600 text-white"
              : "bg-white text-gray-700"
          }`}
        >
          🚛 {t("transport")}
        </button>
      </div>

      {/* ORDER LOGISTICS FORM */}
      {tab === "orders" && (
        <div className="card space-y-5">
          <div>
            <h3 className="text-lg font-bold">Create Order Logistics</h3>
            <p className="text-sm text-gray-500 mt-1">
              Select an order and enter its transportation details.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
            >
              {message}
            </div>
          )}

          {loadingOrders ? (
            <p className="text-sm text-gray-500">Loading orders...</p>
          ) : (
            <form onSubmit={handleCreateLogistics} className="space-y-4">
              <div>
                <label
                  htmlFor="logistics-order"
                  className="block text-sm font-semibold mb-1"
                >
                  Select Order *
                </label>

                <select
                  id="logistics-order"
                  name="orderId"
                  value={form.orderId}
                  onChange={updateForm}
                  className="input-field w-full"
                  required
                >
                  <option value="">Choose an order</option>

                  {orders.map((order) => (
                    <option key={order.orderId} value={order.orderId}>
                      {order.orderId} — {order.commodityId || "Crop"} —{" "}
                      {order.quantity} quintals
                    </option>
                  ))}
                </select>

                {orders.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    No orders found for this account.
                  </p>
                )}
              </div>

              {selectedOrder && (
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm space-y-1">
                  <p>
                    <span className="font-semibold">Buyer:</span>{" "}
                    {selectedOrder.buyerName || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">Crop:</span>{" "}
                    {selectedOrder.commodityId || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">Quantity:</span>{" "}
                    {selectedOrder.quantity ?? "—"} quintals
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="pickupLocation"
                    className="block text-sm font-semibold mb-1"
                  >
                    Pickup Location *
                  </label>
                  <input
                    id="pickupLocation"
                    name="pickupLocation"
                    value={form.pickupLocation}
                    onChange={updateForm}
                    className="input-field w-full"
                    placeholder="Enter pickup location"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="deliveryLocation"
                    className="block text-sm font-semibold mb-1"
                  >
                    Delivery Location *
                  </label>
                  <input
                    id="deliveryLocation"
                    name="deliveryLocation"
                    value={form.deliveryLocation}
                    onChange={updateForm}
                    className="input-field w-full"
                    placeholder="Enter delivery location"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="transporterName"
                    className="block text-sm font-semibold mb-1"
                  >
                    Transporter Name
                  </label>
                  <input
                    id="transporterName"
                    name="transporterName"
                    value={form.transporterName}
                    onChange={updateForm}
                    className="input-field w-full"
                    placeholder="Transporter or company name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="transporterPhone"
                    className="block text-sm font-semibold mb-1"
                  >
                    Transporter Phone
                  </label>
                  <input
                    id="transporterPhone"
                    name="transporterPhone"
                    type="tel"
                    value={form.transporterPhone}
                    onChange={updateForm}
                    className="input-field w-full"
                    placeholder="Contact number"
                  />
                </div>

                <div>
                  <label
                    htmlFor="scheduledDate"
                    className="block text-sm font-semibold mb-1"
                  >
                    Scheduled Date
                  </label>
                  <input
                    id="scheduledDate"
                    name="scheduledDate"
                    type="date"
                    value={form.scheduledDate}
                    onChange={updateForm}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label
                    htmlFor="expectedDelivery"
                    className="block text-sm font-semibold mb-1"
                  >
                    Expected Delivery *
                  </label>
                  <input
                    id="expectedDelivery"
                    name="expectedDelivery"
                    type="date"
                    min={form.scheduledDate || undefined}
                    value={form.expectedDelivery}
                    onChange={updateForm}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="estimatedTransportCost"
                    className="block text-sm font-semibold mb-1"
                  >
                    Estimated Transport Cost (₹) *
                  </label>
                  <input
                    id="estimatedTransportCost"
                    name="estimatedTransportCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.estimatedTransportCost}
                    onChange={updateForm}
                    className="input-field w-full"
                    placeholder="Enter estimated cost"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-semibold mb-1"
                >
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={form.notes}
                  onChange={updateForm}
                  className="input-field w-full min-h-20"
                  placeholder="Optional transportation instructions"
                />
              </div>

              <button
                type="submit"
                disabled={saving || loadingOrders || orders.length === 0}
                className="btn-primary px-5 py-2 disabled:opacity-50"
              >
                {saving ? "Creating Logistics..." : "Create Logistics"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* STORAGE TAB */}
      {tab === "storage" && (
        <>
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="font-bold mb-3">🧮 {t("storage_calculator")}</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold">{t("quintals")}</label>
                <input
                  type="number"
                  min="0"
                  value={calcQty}
                  onChange={(e) =>
                    setCalcQty(Math.max(0, Number(e.target.value)))
                  }
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">{t("days")}</label>
                <input
                  type="number"
                  min="0"
                  value={calcDays}
                  onChange={(e) =>
                    setCalcDays(Math.max(0, Number(e.target.value)))
                  }
                  className="input-field w-full"
                />
              </div>
            </div>

            <p className="mt-3 text-lg font-bold text-blue-800">
              {t("estimated_cost")}:{" "}
              {formatCurrency((calcQty * 15 * calcDays) / 30)}
            </p>
          </div>

          <div className="space-y-3">
            {warehouses.map((wh) => (
              <div key={wh.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{wh.icon}</span>
                      <div>
                        <h3 className="font-bold">{wh.name}</h3>
                        <p className="text-sm text-gray-500">{wh.location}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                      <span>
                        📍 {wh.distance} {t("km_away")}
                      </span>
                      <span>⭐ {wh.rating}</span>
                      <span>
                        📦 {wh.available}/{wh.capacity} {t("quintals")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold">₹{wh.ratePerQuintal}</p>
                    <p className="text-xs text-gray-500">
                      {t("per_quintal")}/month
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setMessage(
                          "Warehouse booking is not connected to the backend yet.",
                        )
                      }
                      className="btn-primary text-sm py-1.5 px-3 mt-2"
                    >
                      {t("book_now")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* TRANSPORT TAB */}
      {tab === "transport" && (
        <div className="space-y-3">
          {transportOptions.map((tr) => (
            <div
              key={tr.id}
              className={`card ${!tr.available ? "opacity-50" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{tr.icon}</span>
                    <div>
                      <h3 className="font-bold">{tr.vehicleType}</h3>
                      <p className="text-sm text-gray-500">
                        🧑 {tr.driver} · ⭐ {tr.rating}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>
                      📦 {t("capacity")}: {tr.capacity} {t("quintals")}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold">₹{tr.pricePerKm}/km</p>
                  <span
                    className={`badge ${tr.available ? "badge-green" : "badge-red"} mt-1`}
                  >
                    {tr.available ? "✅ Available" : "❌ Busy"}
                  </span>

                  {tr.available && (
                    <button
                      type="button"
                      onClick={() => {
                        setTab("orders");
                        setError("");
                        setMessage(
                          "Enter the order and confirm the actual transport cost in Order Logistics.",
                        );
                        setForm((prev) => ({
                          ...prev,
                          estimatedTransportCost: "",
                        }));
                      }}
                      className="btn-primary text-sm py-1.5 px-3 mt-2 block"
                    >
                      {t("book_now")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
