import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

export const socketURL = API_BASE_URL;
