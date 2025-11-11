export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["assets/sql-wasm.wasm","robots.txt"]),
	mimeTypes: {".wasm":"application/wasm",".txt":"text/plain"},
	_: {
		client: {start:"_app/immutable/entry/start.B17-J5af.js",app:"_app/immutable/entry/app.Kvjg4qo3.js",imports:["_app/immutable/entry/start.B17-J5af.js","_app/immutable/chunks/B1gyugQm.js","_app/immutable/chunks/C0WG1Ef3.js","_app/immutable/entry/app.Kvjg4qo3.js","_app/immutable/chunks/ChTlyFlX.js","_app/immutable/chunks/C0WG1Ef3.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/CBscU4cN.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
