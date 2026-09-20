import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Newspaper,
  Package,
  Truck,
  ArrowRight,
  Users,
  WalletCards,
} from "lucide-react";

import MarketTicker from "../components/MarketTicker";
import StatCard from "../components/StatCard";
import PriceCard from "../components/PriceCard";

import { getGreeting, formatCurrency } from "../utils/formatters";

export default function DashboardPage({ user }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [topPrices, setTopPrices] = useState([]);

  const currentUser = user;
  const greeting = getGreeting();
  const [activeLots, setActiveLots] = useState([]);
  const [marketNews, setMarketNews] = useState([]);

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const userId = currentUser?.id || currentUser?._id || currentUser?.userId;

    if (!userId) {
      setActiveLots([]);
      return;
    }

    let cancelled = false;

    const fetchActiveLots = async () => {
      try {
        const response = await fetch(`${API}/api/lots`);

        if (!response.ok) {
          throw new Error(`Lots API error: ${response.status}`);
        }

        const data = await response.json();
        const lots = Array.isArray(data) ? data : data?.lots || [];

        const sellerLots = lots
          .filter(
            (lot) =>
              lot.status === "listed" &&
              String(lot.sellerId) === String(userId),
          )
          .map((lot) => ({
            ...lot,
            crop: String(lot.commodityId || lot.crop || "Crop")
              .replace(/[-_]/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
            price: Number(lot.expectedPrice ?? lot.price ?? 0),
            location: lot.pickupLocation || "—",
            quantity: `${lot.quantity || 0} Quintals`,
            buyerInterest: `${lot.offers?.length || 0} ${
              lot.offers?.length === 1 ? "buyer" : "buyers"
            } interested`,
            status: "Active",
          }));

        if (!cancelled) {
          setActiveLots(sellerLots);
        }
      } catch (error) {
        console.error("Active lots fetch error:", error);

        if (!cancelled) {
          setActiveLots([]);
        }
      }
    };

    fetchActiveLots();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?._id, currentUser?.userId]);

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
    let cancelled = false;

    const fetchMarketNews = async () => {
      try {
        const response = await fetch(`${API}/api/market-news`);

        if (!response.ok) {
          throw new Error(`Market news API error: ${response.status}`);
        }

        const data = await response.json();

        if (!cancelled && data.success && Array.isArray(data.news)) {
          setMarketNews(data.news);
        }
      } catch (error) {
        console.error("Market news fetch error:", error);

        if (!cancelled) {
          setMarketNews([]);
        }
      }
    };

    fetchMarketNews();

    const interval = setInterval(fetchMarketNews, 15 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    let cancelled = false;

    const fetchMandiPrices = async () => {
      try {
        const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await fetch(`${API}/api/mandi-prices?limit=20`, {
          headers: { Accept: "application/json" },
        });
        if (!response.ok)
          throw new Error(`Mandi API error: ${response.status}`);

        const data = await response.json();
        if (!Array.isArray(data?.records))
          throw new Error("No mandi records found");

        const records = data.records
          .map((item) => ({
            ...item,
            commodity: String(
              item?.commodity ??
                item?.Commodity ??
                item?.crop ??
                item?.Crop ??
                "",
            ).trim(),
            market: String(
              item?.market ??
                item?.Market ??
                item?.market_name ??
                item?.Market_Name ??
                item?.district ??
                item?.District ??
                "",
            ).trim(),
            state: String(item?.state ?? item?.State ?? "").trim(),
            min_price: Number(
              item?.min_price ??
                item?.Min_Price ??
                item?.["Min Price"] ??
                item?.minPrice ??
                0,
            ),
            max_price: Number(
              item?.max_price ??
                item?.Max_Price ??
                item?.["Max Price"] ??
                item?.maxPrice ??
                0,
            ),
            modal_price: Number(
              item?.modal_price ??
                item?.Modal_Price ??
                item?.["Modal Price"] ??
                item?.modalPrice ??
                0,
            ),
          }))
          .filter(
            (item) => item.commodity && item.market && item.modal_price > 0,
          );

        if (!records.length) throw new Error("No valid mandi prices available");

        const saved = JSON.parse(
          localStorage.getItem("bf_mandi_previous_prices") || "{}",
        );

        const updated = records.map((item) => {
          const key = `${item.commodity}-${item.market}`.toLowerCase();
          const previous = Number(saved[key]);
          const change =
            previous > 0
              ? ((item.modal_price - previous) / previous) * 100
              : null;

          return {
            ...item,
            change,
            type:
              change == null
                ? "current"
                : change > 0
                  ? "up"
                  : change < 0
                    ? "down"
                    : "same",
          };
        });

        localStorage.setItem(
          "bf_mandi_previous_prices",
          JSON.stringify(
            Object.fromEntries(
              records.map((item) => [
                `${item.commodity}-${item.market}`.toLowerCase(),
                item.modal_price,
              ]),
            ),
          ),
        );

        if (!cancelled) setTopPrices(updated.slice(0, 6));
      } catch (error) {
        console.error("Mandi price fetch error:", error);
      }
    };

    fetchMandiPrices();
    const interval = setInterval(fetchMandiPrices, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const quickActions = [
    {
      image: "/images/actions/new-lot.jpg",
      label: "New Lot",
      path: "/lots",
    },
    {
      image: "/images/actions/find-buyer.jpg",
      label: "Find Buyer",
      path: "/buyers",
    },
    {
      image: "/images/actions/customer-complaint.jpg",
      label: "Complaint",
      path: "/disputes",
    },
    {
      image: "/images/actions/payment.jpg",
      label: "Track Payment",
      path: "/payments",
    },
  ];
  return (
    <div className="w-full">
      <section
        className="
          relative
          w-full
          overflow-hidden
          rounded-3xl
          border
          border-primary-100
          bg-primary-50
          shadow-sm
        "
      >
        <div
          className="
            grid
            grid-cols-1
            lg:grid-cols-[1.1fr_0.9fr]
            min-h-[280px]
            sm:min-h-[300px]
            lg:min-h-[320px]
          "
        >
          <div
            className="
              flex
              items-center
              px-6
              py-8
              sm:px-8
              lg:px-10
              xl:px-12
            "
          >
            <div className="max-w-2xl">
              <p className="text-base sm:text-lg font-semibold text-primary-700">
                {t(greeting)}, {currentUser?.name || "Farmer"}
              </p>

              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <MapPin
                  size={17}
                  strokeWidth={2}
                  className="text-primary-600"
                />

                <span className="text-sm sm:text-base font-medium">
                  {currentUser?.location || "India"}
                </span>
              </div>

              <h2
                className="
                  text-3xl
                  sm:text-4xl
                  lg:text-5xl
                  font-extrabold
                  leading-tight
                  tracking-tight
                  text-gray-900
                  mt-6
                "
              >
                Your crop deserves
                <br />
                <span className="text-primary-700">the right market.</span>
              </h2>

              <p
                className="
                  text-sm
                  sm:text-base
                  text-gray-600
                  mt-4
                  max-w-xl
                  leading-relaxed
                "
              >
                Check today's prices, discover better buyers and make a smarter
                selling decision.
              </p>
            </div>
          </div>

          <div className="relative min-h-[220px] lg:min-h-full">
            <img
              src="/images/hero/farmer-dash.jpg"
              alt="Farmer working in agricultural field"
              className="
                absolute
                inset-0
                w-full
                h-full
                object-cover
              "
            />

            <div
              className="
                absolute
                inset-0
                bg-gradient-to-r
                from-primary-50
                via-transparent
                to-transparent
                lg:block
                hidden
              "
            />
          </div>
        </div>
      </section>

      <div
        className="
          w-full
          max-w-[1500px]
          mx-auto
          px-4
          sm:px-6
          lg:px-8
          py-6
          space-y-7
          pb-10
        "
      >
        <MarketTicker />

        <div
          className="
            grid
            grid-cols-2
            lg:grid-cols-4
            gap-3
          "
        >
          <StatCard
            image="/images/stats/best-price.jpg"
            label="Today's Best Price"
            value={
              topPrices.length
                ? formatCurrency(
                    Math.max(...topPrices.map((p) => p.modal_price)),
                  )
                : "—"
            }
            color="primary"
          />

          <StatCard
            image="/images/stats/active-lots.jpg"
            label="Active Lots"
            value={String(activeLots.length)}
            color="blue"
          />

          <StatCard
            image="/images/stats/pending-payment.jpg"
            label="Payments Pending"
            value={formatCurrency(0)}
            color="yellow"
          />

          <StatCard
            image="/images/stats/nearby-buyer.jpg"
            label="Recommended Buyers"
            value="0"
            color="primary"
          />
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {t("quick_actions")}
              </h3>

              <p className="text-sm text-gray-500 mt-0.5">
                Quickly access your farming activities
              </p>
            </div>
          </div>

          <div
            className="
              grid
              grid-cols-2
              sm:grid-cols-4
              gap-4
            "
          >
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="
                  group
                  bg-white
                  border
                  border-gray-200
                  rounded-2xl
                  overflow-hidden
                  text-left
                  shadow-sm
                  hover:shadow-lg
                  hover:border-primary-300
                  hover:-translate-y-0.5
                  transition-all
                  duration-200
                "
              >
                <div
                  className="
                    h-20
                    sm:h-24
                    w-full
                    overflow-hidden
                    bg-gray-100
                  "
                >
                  <img
                    src={action.image}
                    alt={action.label}
                    className="
                      w-full
                      h-full
                      object-cover
                      transition-transform
                      duration-300
                      group-hover:scale-105
                    "
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>

                <div className="px-4 py-3">
                  <span
                    className="
                      text-sm
                      font-semibold
                      text-gray-800
                    "
                  >
                    {action.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div
            className="
              flex
              items-center
              justify-between
              mb-3
            "
          >
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Your Active Lots
              </h3>

              <p className="text-sm text-gray-500 mt-0.5">
                Monitor your currently listed crops
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/lots")}
              className="
                inline-flex
                items-center
                gap-1
                text-primary-600
                text-sm
                font-semibold
                hover:text-primary-700
              "
            >
              View All
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="space-y-3">
            {activeLots.length ? (
              activeLots.map((lot) => (
                <div
                  key={lot.id}
                  className="
                  bg-white
                  border
                  border-gray-200
                  rounded-2xl
                  shadow-sm
                  p-4
                  hover:shadow-md
                  transition-shadow
                "
                >
                  <div
                    className="
                    flex
                    flex-col
                    lg:flex-row
                    lg:items-center
                    lg:justify-between
                    gap-4
                  "
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="
                        w-11
                        h-11
                        rounded-xl
                        bg-green-50
                        border
                        border-green-100
                        flex
                        items-center
                        justify-center
                        flex-shrink-0
                      "
                      >
                        <Package size={21} className="text-green-600" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-gray-900">
                            {lot.crop}
                          </h4>

                          <span
                            className="
                            px-2
                            py-1
                            rounded-md
                            bg-green-50
                            text-green-700
                            text-[11px]
                            font-semibold
                          "
                          >
                            {lot.status}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          Lot ID: {lot.id}
                        </p>

                        <div
                          className="
                          flex
                          flex-wrap
                          items-center
                          gap-x-4
                          gap-y-1
                          mt-2
                          text-sm
                          text-gray-600
                        "
                        >
                          <span>{lot.quantity}</span>

                          <span>{lot.grade}</span>

                          <span>
                            ₹{lot.price.toLocaleString("en-IN")}
                            /q
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="
                      flex
                      flex-col
                      sm:flex-row
                      sm:items-center
                      gap-3
                      lg:min-w-[360px]
                      lg:justify-end
                    "
                    >
                      <div
                        className="
                        text-sm
                        text-gray-600
                        sm:text-right
                      "
                      >
                        <p className="flex items-center gap-1.5 sm:justify-end">
                          <MapPin size={14} />
                          {lot.location}
                        </p>

                        <p
                          className="
                          flex
                          items-center
                          gap-1.5
                          mt-1
                          text-green-700
                          font-medium
                          sm:justify-end
                        "
                        >
                          <Users size={14} />
                          {lot.buyerInterest}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate("/lots")}
                        className="
                        inline-flex
                        items-center
                        justify-center
                        gap-1.5
                        px-4
                        py-2.5
                        rounded-xl
                        border
                        border-gray-200
                        bg-gray-50
                        text-sm
                        font-semibold
                        text-gray-700
                        hover:bg-gray-100
                        transition-colors
                      "
                      >
                        View Lot
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-sm text-gray-500">
                No active lots yet. Create a lot to see it here.
              </div>
            )}
          </div>
        </section>

        <section>
          <div
            className="
              flex
              items-center
              justify-between
              mb-3
            "
          >
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {t("top_prices_today")}
              </h3>

              <p className="text-sm text-gray-500 mt-0.5">
                Latest mandi prices from government data
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/prices")}
              className="
                text-primary-600
                text-sm
                font-semibold
                hover:text-primary-700
              "
            >
              {t("mandi_prices")} →
            </button>
          </div>

          {topPrices.length > 0 ? (
            <div
              className="
                flex
                gap-3
                overflow-x-auto
                pb-2
                -mx-4
                px-4
                snap-x
              "
            >
              {topPrices.map((price, index) => (
                <div
                  key={index}
                  className="
                    snap-start
                    flex-shrink-0
                  "
                >
                  <PriceCard price={price} />
                </div>
              ))}
            </div>
          ) : (
            <div
              className="
                bg-white
                border
                border-gray-200
                rounded-2xl
                px-5
                py-8
                text-center
                text-sm
                text-gray-500
              "
            >
              Loading latest mandi prices...
            </div>
          )}
        </section>

        <section>
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900">
              {t("price_alerts")}
            </h3>

            <p className="text-sm text-gray-500 mt-0.5">
              Latest changes in mandi prices
            </p>
          </div>

          <div className="space-y-2">
            {topPrices.slice(0, 4).map((alert, index) => (
              <div
                key={index}
                className="
                  bg-white
                  border
                  border-gray-200
                  rounded-2xl
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3
                  shadow-sm
                  hover:shadow-md
                  transition-shadow
                "
              >
                <div
                  className="
                    w-10
                    h-10
                    rounded-xl
                    bg-gray-50
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >
                  {alert.type === "up" ? (
                    <TrendingUp size={20} className="text-green-600" />
                  ) : alert.type === "down" ? (
                    <TrendingDown size={20} className="text-red-500" />
                  ) : alert.type === "same" ? (
                    <Minus size={20} className="text-gray-500" />
                  ) : (
                    <Package size={20} className="text-gray-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {alert.change !== null
                      ? `${alert.commodity} prices ${
                          alert.change > 0
                            ? "increased"
                            : alert.change < 0
                              ? "decreased"
                              : "unchanged"
                        }${alert.change === 0 ? "" : ` ${Math.abs(alert.change).toFixed(1)}%`} at ${alert.market}`
                      : `${alert.commodity} is currently ₹${alert.modal_price.toLocaleString("en-IN")}/q at ${alert.market}`}
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5">
                    {alert.state || "Latest mandi update"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900">
              {t("market_news")}
            </h3>

            <p className="text-sm text-gray-500 mt-0.5">
              Latest updates affecting farmers and markets
            </p>
          </div>

          <div className="space-y-2">
            {marketNews.length ? (
              marketNews.slice(0, 4).map((news) => (
                <a
                  key={news.id || news.link}
                  href={news.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-primary-50 border border-primary-200 rounded-2xl p-4 hover:bg-primary-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-primary-100 flex items-center justify-center shrink-0">
                      <Newspaper size={18} className="text-primary-600" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {news.title}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {news.source || "PIB"} •{" "}
                        {news.publishedAt
                          ? new Date(news.publishedAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "Latest update"}
                      </p>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 text-sm text-gray-600">
                Latest agriculture news is temporarily unavailable.
              </div>
            )}
          </div>
        </section>

        <section
          className="
            bg-white
            border
            border-gray-200
            rounded-2xl
            px-5
            py-4
          "
        >
          <div
            className="
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-4
            "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                  w-10
                  h-10
                  rounded-xl
                  bg-green-50
                  border
                  border-green-100
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <WalletCards size={19} className="text-green-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Sell with greater confidence
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Track orders, payments and buyer activity from one place.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/payments")}
              className="
                inline-flex
                items-center
                justify-center
                gap-1.5
                px-4
                py-2.5
                rounded-xl
                bg-gray-900
                text-white
                text-sm
                font-semibold
                hover:bg-gray-800
                transition-colors
              "
            >
              View Payments
              <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
