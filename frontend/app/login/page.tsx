"use client";

import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

type FormData = {
  email: string;
  password: string;
};
const apiURL = process.env.NEXT_PUBLIC_API_URL;

export default function Login() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  // React Query mutation for login
  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(`${apiURL}/api/auth/login`, data);
      return response.data;
    },

    onSuccess: (data) => {
      toast.success("Logged in successfully!");

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);

      setTimeout(() => {
        if (data.user.role === "admin") {
          router.push("/admin");
        } else if (data.user.role === "kitchen") {
          router.push("/kitchen");
        } else {
          router.push("/customer");
        }
      }, 800);
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data);
  };

  const handleBack = () => router.push("/");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-6 relative">
      {/* Back Button */}
      {/* <button
        onClick={handleBack}
        className="absolute top-5 right-5 px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg shadow hover:bg-yellow-300 transition"
      >
        Back
      </button> */}

      {/* Soft Black Lights */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-32 left-10 w-64 h-64 bg-gray-700 opacity-20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-gray-600 opacity-20 blur-3xl rounded-full"></div>
      </div>

      {/* Glass Card */}
      <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-2xl p-10 w-full max-w-md text-white">
        <h1 className="text-4xl font-bold text-center mb-6 text-yellow-300">
          Welcome Back
        </h1>

        <p className="text-center text-gray-300 mb-8">
          Login to continue ordering with QuickOrders
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 outline-none"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^@ ]+@[^@ ]+\.[^@ .]{2,}$/,
                message: "Email is invalid",
              },
            })}
          />
          {errors.email && (
            <p className="text-red-500">{errors.email.message}</p>
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
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-5 text-gray-300">
          Don't have an account?{" "}
          <span
            className="text-yellow-300 font-semibold cursor-pointer hover:underline"
            onClick={() => router.push("/signup")}
          >
            Signup
          </span>
        </p>
      </div>
    </div>
  );
}
