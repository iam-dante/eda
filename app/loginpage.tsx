export default function LoginPage() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-[50%] h-[50%] p-6">
        <div className="flex flex-col justify-center items-center">
          <h1 className="text-3xl font-semibold">Sign In</h1>
          <h1 className="text-lg">Enter your email and password to sign in</h1>
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
              <div className="mt-2">
                <input
                  placeholder="Password"
                  type="password"
                  name="password"
                  id="password"
                  required
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <h1>Forgot Password ?</h1>
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
            <h1>Sign in with Google</h1>
          </button>
          <div className="flex space-x-1 justify-center py-2">
            <h1>Not registered?</h1>
            <a href="#" className="font-bold text-gray-900">
              Create account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
