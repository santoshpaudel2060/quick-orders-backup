"use client";

import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";

type FormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export default function Signup() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  // React Query mutation for signup
  const signupMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      // On successful signup, redirect to login page
      toast.success("Registered successfully!");
      // Redirect after 1 second (optional)
      setTimeout(() => router.push("/login"), 1000);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Signup failed");
    },
  });

  const onSubmit = (data: FormData) => {
    signupMutation.mutate(data);
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-6 relative">
      {/* Back Button */}

      {/* Soft Black Lights */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-32 left-10 w-64 h-64 bg-gray-700 opacity-20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-gray-600 opacity-20 blur-3xl rounded-full"></div>
      </div>

      {/* Glass Card */}
      <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-2xl p-10 w-full max-w-md text-white">
        <h1 className="text-4xl font-bold text-center mb-6 text-yellow-300">
          Create Account
        </h1>

        <p className="text-center text-gray-300 mb-8">
          Join QuickOrders and enjoy premium hotel ordering
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 outline-none"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && <p className="text-red-500">{errors.name.message}</p>}

          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 outline-none"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^@ ]+@[^@ ]+\.[^@ .]{2,}$/,
                message: "Email is not valid",
              },
            })}
          />
          {errors.email && (
            <p className="text-red-500">{errors.email.message}</p>
          )}

          <input
            type="tel"
            placeholder="Phone Number"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 outline-none"
            {...register("phone", {
              required: "Phone is required",
              pattern: {
                value: /^[0-9]{7,15}$/,
                message: "Phone number is invalid",
              },
            })}
          />
          {errors.phone && (
            <p className="text-red-500">{errors.phone.message}</p>
          )}

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 outline-none"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
          />
          {errors.password && (
            <p className="text-red-500">{errors.password.message}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 transition-all font-semibold shadow-lg text-black"
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-5 text-gray-300">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-yellow-300 font-semibold cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
