<script>
    export let isAuthenticated = false;
    export let onLogin = () => {};
    export let onSignup = () => {};
    
    let username = "";
    let email = "";
    let password = "";
    let signUp = false;
    let loading = false;
    let error = "";
    let display_consent = false;
    let cgu = false;

    async function handleLoginSubmit(event) {
        event.preventDefault();
        if (!username || !password) {
            error = "Please fill in all fields";
            return;
        }
        
        loading = true;
        error = "";
        
        try {
            const success = await onLogin(username, password);
            if (!success) {
                error = "Invalid username or password";
            }
        } catch (err) {
            error = "Login failed. Please try again.";
        }
        
        loading = false;
    }

    async function handleSignupSubmit(event) {
        event.preventDefault();
        if (!username || !email || !password || !cgu) {
            error = "Please fill in all mandatory fields";
            return;
        }

        if (!display_consent) {
            display_consent = false;
        }

        loading = true;
        error = "";
        
        try {
            const success = await onSignup(username, email, password, display_consent, cgu);
            if (!success) {
                error = "Registration failed. Please try again.";
            }
        } catch (err) {
            error = "Registration failed. Please try again.";
        }
        
        loading = false;
    }

    function toggleSignUp() {
        signUp = !signUp;
        error = "";
        username = "";
        email = "";
        password = "";
        display_consent = false;
        cgu = false;
    }
</script>

{#if !isAuthenticated && !signUp}
<div class="w-full max-w-md mx-auto min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-3">
  <div class="bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
    <div class="bg-gradient-to-r from-emerald-400 to-cyan-400 p-5 text-slate-900 shadow-md">
      <h1 class="font-extrabold text-xl tracking-tight text-center">🔍 CSC Instagram Analyzer</h1>
      <p class="text-xs mt-1 font-medium text-center">Please authenticate to continue</p>
    </div>
    
    <div class="p-6">
      <h2 class="text-lg font-semibold text-slate-200 mb-2">Welcome Back!</h2>
      <p class="text-sm text-slate-400 mb-6">Sign in to access Instagram privacy analysis</p>

      {#if error}
        <div class="mb-4 p-3 bg-red-500/20 border border-red-400 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      {/if}

      <form on:submit={handleLoginSubmit} class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2 text-slate-300" for="username">Username</label>
          <input 
            id="username" 
            bind:value={username} 
            disabled={loading}
            class="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors" 
            placeholder="Enter your username"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2 text-slate-300" for="password">Password</label>
          <input 
            id="password" 
            type="password" 
            bind:value={password} 
            disabled={loading}
            class="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
            placeholder="Enter your password" 
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          class="w-full py-3 bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 font-semibold rounded-lg hover:from-emerald-300 hover:to-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {#if loading}
            <span class="loading loading-spinner loading-sm"></span>
            Signing In...
          {:else}
            🚀 Sign In
          {/if}
        </button>
      </form>
      
      <p class="text-sm text-slate-400 mt-6 text-center">
        New to CSC? 
        <button 
          on:click={toggleSignUp}
          class="text-cyan-400 hover:text-cyan-300 hover:underline font-medium transition-colors"
        > 
          Create Account 
        </button>
      </p>
    </div>
  </div>
</div>
{/if}

{#if signUp}
  <div class="w-full max-w-md mx-auto min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-3">
    <div class="bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
      <div class="bg-gradient-to-r from-emerald-400 to-cyan-400 p-5 text-slate-900 shadow-md">
        <h1 class="font-extrabold text-xl tracking-tight text-center">🔍 CSC Instagram Analyzer</h1>
        <p class="text-xs mt-1 font-medium text-center">Create your account</p>
      </div>
      
      <div class="p-6">
        <h2 class="text-lg font-semibold text-slate-200 mb-2">Join CSC</h2>
        <p class="text-sm text-slate-400 mb-6">Create an account to start analyzing Instagram privacy</p>

        {#if error}
          <div class="mb-4 p-3 bg-red-500/20 border border-red-400 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        {/if}

        <form on:submit={handleSignupSubmit} class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2 text-slate-300" for="new-username">Username</label>
            <input 
              id="new-username" 
              bind:value={username} 
              disabled={loading}
              type="text" 
              class="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
              placeholder="Choose a username" 
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2 text-slate-300" for="email">Email</label>
            <input 
              id="email" 
              bind:value={email} 
              disabled={loading}
              type="email" 
              class="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
              placeholder="Enter your email" 
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2 text-slate-300" for="new-password">Password</label>
            <input 
              id="new-password" 
              bind:value={password} 
              disabled={loading}
              type="password" 
              class="w-full px-4 py-3 border border-slate-600 rounded-lg bg-slate-900 text-slate-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
              placeholder="Create a password" 
            />
          </div>
          <div class="flex items-center">
            <input 
              id="display-consent" 
              type="checkbox" 
              bind:checked={display_consent} 
              disabled={loading}
              class="h-4 w-4 text-emerald-400 border-slate-600 bg-slate-900 focus:ring-emerald-400"
            />
            <label for="display-consent" class="ml-2 block text-sm text-slate-300">
              I consent to the display of my data for the results of the analysis.
            </label>
          </div>
          <div class="flex items-center">
            <input 
              id="cgu" 
              type="checkbox" 
              bind:checked={cgu} 
              disabled={loading}
              class="h-4 w-4 text-emerald-400 border-slate-600 bg-slate-900 focus:ring-emerald-400"
            />
            <label for="cgu" class="ml-2 block text-sm text-slate-300">
              I agree to the Terms and Conditions*.
            </label>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            class="w-full py-3 bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 font-semibold rounded-lg hover:from-emerald-300 hover:to-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {#if loading}
              <span class="loading loading-spinner loading-sm"></span>
              Creating Account...
            {:else}
              ✨ Create Account
            {/if}
          </button>
        </form>
        
        <p class="text-sm text-slate-400 mt-6 text-center">
          Already have an account? 
          <button 
            on:click={toggleSignUp}
            class="text-cyan-400 hover:text-cyan-300 hover:underline font-medium transition-colors"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  </div>
{/if}