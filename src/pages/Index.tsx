import { Search, Car, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import { Link } from "react-router-dom";
import { useState } from "react";

const Index = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2djhoLTh2LThoOHptLTE2IDB2OGgtOHYtOGg4em0xNiAxNnY4aC04di04aDh6bS0xNiAwdjhoLTh2LThoOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
        
        <div className="container relative z-10 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white md:text-6xl">
              Travel Smart from <span className="text-accent">Swat</span>
            </h1>
            <p className="mb-8 text-lg text-white/90 md:text-xl">
              Share rides, save money, and travel safely to any city in Pakistan
            </p>

            {/* Search Box */}
            <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="From: Swat"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="To: Islamabad, Peshawar, Lahore..."
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                </div>
                <Link to="/search" className="block">
                  <Button size="lg" className="w-full h-12 text-lg bg-gradient-hero hover:opacity-90 transition-opacity">
                    Search Rides
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/post-ride">
                <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                  <Car className="mr-2 h-5 w-5" />
                  Offer a Ride
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Why Choose SwatPool?</h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl bg-gradient-card p-8 shadow-card text-center transition-all hover:shadow-card-hover">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Safe & Verified</h3>
              <p className="text-muted-foreground">
                All drivers are verified with ID and reviews for your safety
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-card p-8 shadow-card text-center transition-all hover:shadow-card-hover">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                <Car className="h-8 w-8 text-accent" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Affordable Rides</h3>
              <p className="text-muted-foreground">
                Share costs and travel at a fraction of private taxi prices
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-card p-8 shadow-card text-center transition-all hover:shadow-card-hover">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Flexible Schedule</h3>
              <p className="text-muted-foreground">
                Find rides that match your travel time and preferences
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted">
        <div className="container px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Start Your Journey?</h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join thousands of travelers sharing rides from Swat
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/search">
              <Button size="lg" className="bg-gradient-hero hover:opacity-90 transition-opacity">
                Find a Ride
              </Button>
            </Link>
            <Link to="/post-ride">
              <Button size="lg" variant="outline">
                Offer a Ride
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
