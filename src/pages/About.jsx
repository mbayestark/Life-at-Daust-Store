import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Heart, Users, MapPin, ShieldCheck, Zap } from "lucide-react";

export default function About() {
  const values = [
    { icon: Sparkles, title: "Uncompromising Quality", text: "Every thread is chosen for its performance and feel. We partner with the best textile experts in Senegal to ensure your DAUST merch lasts for generations." },
    { icon: Heart, title: "Student-Led Design", text: "Our designs are born in the DAUST studios. They reflect the real experiences and aspirations of our student body, not just corporate branding." },
    { icon: Users, title: "Family Support", text: "15% of all profits go directly into the DAUST Financial Aid program, ensuring that excellence is never limited by background." },
  ];

  return (
    <main className="bg-white">
      {/* Premium Hero Section */}
      <section className="relative min-h-[70vh] flex items-center bg-brand-navy overflow-hidden">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-40 scale-105"
            src="/assets/DaustianShoot/PHOTO-2026-01-31-23-01-44.jpg"
            alt="About Life at DAUST"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-transparent to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-3xl animate-fade-in-up">
            <h1 className="text-[clamp(3.5rem,8vw,5.5rem)] font-[900] text-white tracking-[-0.04em] leading-[0.9] mb-8">
              Legacy in <br className="hidden lg:block" /> the Making
            </h1>
            <p className="text-xl text-white/70 max-w-2xl leading-relaxed font-medium">
              Life at DAUST isn't just a store. It's the tangible manifestation of African excellence,
              designed by the brightest minds in engineering and business.
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div data-aos="fade-right">
              <h2 className="text-[var(--text-4xl)] font-[900] text-brand-navy tracking-tight mb-8 leading-tight">
                Crafted for those <br /> who lead.
              </h2>
              <div className="space-y-6">
                <p className="text-lg text-gray-600 leading-relaxed italic border-l-4 border-brand-orange/30 pl-6">
                  "We didn't want a generic school store. We wanted a lifestyle brand that an engineer would wear in a lab and a student would wear on a night out."
                </p>
                <p className="text-gray-500 text-base leading-relaxed">
                  Every product undergoes a rigorous selection process. From the weight of our hoodies to the
                  stitch density of our embroidery, we prioritize durability. Because excellence isn't just
                  an act, it's a habit.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6" data-aos="fade-left">
              <div className="aspect-[4/5] rounded-3xl bg-gray-100 overflow-hidden transform translate-y-8">
                <img src="/assets/DaustianShoot/PHOTO-2026-01-31-23-01-09.jpg" alt="Fabric detail" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-[4/5] rounded-3xl bg-gray-100 overflow-hidden">
                <img src="/assets/DaustianShoot/PHOTO-2026-01-31-23-01-01.jpg" alt="Student wearing merch" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="bg-brand-cream/50 py-24 sm:py-32 border-y border-brand-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-[var(--text-3xl)] font-[900] text-brand-navy tracking-tight mb-4">Core Principles</h2>
            <p className="text-gray-500 text-base">Sustainability, Student Empowerment, and Excellence are at the heart of everything we produce.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className={`bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group animate-fade-in-up delay-${(i + 1) * 100}`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-6 group-hover:bg-brand-orange group-hover:text-white transition-all duration-500">
                    <Icon size={24} />
                  </div>
                  <h3 className="font-[900] text-brand-navy text-xl mb-4">{v.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32">
        <div className="bg-brand-navy rounded-[3rem] p-12 sm:p-20 text-center relative overflow-hidden group">
          <div className="absolute inset-0 dot-pattern opacity-10" />
          <div className="relative z-10">
            <h2 className="text-[var(--text-4xl)] font-[900] text-white tracking-tight mb-6">
              Wear the Pride. <br /> Join the Family.
            </h2>
            <Link
              to="/shop"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-brand-navy rounded-full font-[900] uppercase tracking-[0.15em] text-xs hover:bg-brand-orange hover:text-white transition-all duration-300 shadow-2xl"
            >
              Start Shopping <Zap size={14} className="fill-current" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
