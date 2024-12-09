"use client";
import { useState } from "react";
import Link from "next/link";

import { useSession, signIn, signOut } from "next-auth/react";


export default function LoginPage() {
  // const { data: session } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  function ViewEye() {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="size-5"
      >
        <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
        <path
          fillRule="evenodd"
          d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  function NotViewEye() {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="size-5"
      >
        <path
          fillRule="evenodd"
          d="M3.28 2.22a.75.75 0 0 0-1.06 1.06l14.5 14.5a.75.75 0 1 0 1.06-1.06l-1.745-1.745a10.029 10.029 0 0 0 3.3-4.38 1.651 1.651 0 0 0 0-1.185A10.004 10.004 0 0 0 9.999 3a9.956 9.956 0 0 0-4.744 1.194L3.28 2.22ZM7.752 6.69l1.092 1.092a2.5 2.5 0 0 1 3.374 3.373l1.091 1.092a4 4 0 0 0-5.557-5.557Z"
          clipRule="evenodd"
        />
        <path d="m10.748 13.93 2.523 2.523a9.987 9.987 0 0 1-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 0 1 0-1.186A10.007 10.007 0 0 1 2.839 6.02L6.07 9.252a4 4 0 0 0 4.678 4.678Z" />
      </svg>
    );
  }

  return (
    <div className="h-screen">
      <div className="h-[10%]  w-full flex items-center justify-end px-12">
        <Link
          href="/homepage"
          className="px-4 py-2 hover:bg-sky-200 rounded-full hover:border-sky-600 hover:border border border-white"
        >
          <h1 className="text-sky-800 font-bold text-md">
            Try without Sign In
          </h1>
        </Link>
      </div>
      <div className="flex justify-center items-center h-[90%]">
        <div className="w-[50%] h-[50%] p-6">
          <div className="flex flex-col justify-center items-center">
            <h1 className="text-3xl font-semibold">Sign In</h1>
            <h1 className="text-lg">
              Enter your email and password to sign in
            </h1>
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form className="space-y-2 " action="#" method="POST">
              <div>
                <label
                  for="email"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    placeholder="Email"
                    type="email"
                    name="email"
                    id="email"
                    autocomplete="email"
                    required
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                  />
                </div>
              </div>
              <div>
                <label
                  for="email"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    required
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 pr-10"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? <ViewEye /> : <NotViewEye />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Link href="/" className="font-semibold text-black hover:text-sky-700">
                  Forgot Password ?
                </Link>
              </div>
              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-sky-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Sign in
                </button>
              </div>
            </form>
            <button className="mt-6 w-full flex h-10 items-center justify-center gap-2 border rounded-md">
              <img
                src={`https://www.material-tailwind.com/logos/logo-google.png`}
                alt="google"
                className="h-6 w-6"
              />
              <h1 className="font-medium">Sign in with Google</h1>
            </button>
            <div className="flex space-x-1 justify-center py-2">
              <h1>Not registered?</h1>
              <Link
                href="#"
                className="font-bold text-gray-900 hover:text-sky-700"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>

    // <div style={{ textAlign: "center", marginTop: "50px" }}>
    //   {!session ? (
    //     <>
    //       <h1>Welcome to NextAuth.js with Google Sign-In</h1>
    //       <button onClick={() => signIn("google")}>Sign in with Google</button>
    //     </>
    //   ) : (
    //     <>
    //       <h1>Welcome, {session.user.name}!</h1>
    //       <p>Email: {session.user.email}</p>
    //       <button onClick={() => signOut()}>Sign out</button>
    //     </>
    //   )}
    // </div>
  );
}
