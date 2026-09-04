import {
  ShieldCheck,
  TrendingUp,
  Users,
  CircleCheck,
} from "lucide-react";

import ScrollReveal from "./ScrollReveal";

const benefits = [
  {
    icon: ShieldCheck,
    title: "More Transparent",
    text: "Access clear market and buyer information before making selling decisions.",
  },
  {
    icon: TrendingUp,
    title: "Better Market Access",
    text: "Explore more buyers and market opportunities beyond your local network.",
  },
  {
    icon: Users,
    title: "Direct Connections",
    text: "Connect farmers, FPOs and buyers through one digital platform.",
  },
  {
    icon: CircleCheck,
    title: "Simple & Organized",
    text: "Keep produce listings, deals, payments and delivery information organized.",
  },
];

const WhyBharatFasal = () => {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="grid items-center gap-12 lg:grid-cols-2">

          {/* Left Content */}
          <ScrollReveal>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
                Why Bharat Fasal
              </p>

              <h2 className="mt-2 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
                Making Agricultural Trade Simpler
              </h2>

              <p className="mt-5 max-w-xl text-base leading-7 text-gray-600">
                Bharat Fasal brings important market information and
                agricultural trade activities together, helping users make
                more informed decisions and build better connections.
              </p>
            </div>
          </ScrollReveal>

          {/* Right Benefits */}
          <div className="grid gap-5 sm:grid-cols-2">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;

              return (
                <ScrollReveal
                  key={benefit.title}
                  delay={index * 100}
                >
                  <div className="h-full rounded-xl border border-gray-200 bg-[#F8FAF5] p-6 transition duration-200 hover:-translate-y-1 hover:border-green-200 hover:shadow-md">

                    {/* Icon */}
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50">
                      <Icon
                        className="h-5 w-5 text-green-700"
                        strokeWidth={1.8}
                      />
                    </div>

                    {/* Title */}
                    <h3 className="mt-5 text-lg font-semibold text-gray-900">
                      {benefit.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {benefit.text}
                    </p>

                  </div>
                </ScrollReveal>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
};

export default WhyBharatFasal;