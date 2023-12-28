import { Router } from 'itty-router';
import { emailLateBorrowers } from "./reminder";

// Create a new router
const router = Router();

const corsHeaders = (env) => ({
		'Access-Control-Allow-Origin': env.STAGE ? 'https://stage.games-ui.pages.dev' : 'https://games.chill.ws',
		'Access-Control-Allow-Headers': 'x-cfp, content-type',
		'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
		'Access-Control-Allow-Credentials': 'true',
});

router.get('/games/list', async (request, env, context) => {
	if (request.headers.get('x-cfp') != env.CFP_PASSWORD) {
			return new Response(JSON.stringify([{"id":"error","name":"Error retrieving list of games","cover":"/images/error.jpg"}]), {status: 200, headers: {...corsHeaders(env),}});
	}

	let keys = await env.games.list();

	let json = await Promise.all(keys.keys.map(key => env.games.get(key.name, { type: "json" })))
			.then(values => JSON.stringify(values));
	return new Response(json, {
			status: 200,
			headers: {
					...corsHeaders(env),
					"Content-type": "application/json",
			}
	});
});

const getBorrowed = async (env) => {
	const keys = await env.borrowed.list();

	return Promise.all(keys.keys.map(key => env.borrowed.get(key.name, { type: "json" })));
};

router.get('/games/borrowed', async (request, env, context) => {
	if (request.headers.get('x-cfp') != env.CFP_PASSWORD) {
		return new Response(JSON.stringify({"id":"error","name":"Error retrieving list of borrowed games"}), {status: 200, headers: {...corsHeaders(env),}});
	}

	const json = await getBorrowed(env);

	return new Response(JSON.stringify(json), {
		status: 200,
		headers: {
			...corsHeaders(env),
			"Content-type": "application/json",
		}
	});
});

/*
Example post body
{
   "id": "68448",
   "borrowed": {
     "name":"Paul",
     "email":"pajones@adobe.com",
     "date":"2023-05-12"
   }
}
*/
router.put('/games/borrow', async (request, env, context) => {
		if (request.headers.get('x-cfp') != env.CFP_PASSWORD) {
				return new Response(JSON.stringify({"error": "forbidden"}), {
					status: 403,
					headers: {
						...corsHeaders(env),
						"Content-type": "application/json"
					}
				});
		}
		let game = await request.json();
		if (game == undefined) {
				return new Response(JSON.stringify({'error': 'Please provide borrowers information.'}), {
					status: 400,
					headers: {
						...corsHeaders(env),
						"Content-type": "application/json"
					}
				});
		}

		let json = JSON.stringify(game);
		let resp = await env.borrowed.put(game.id, json);
		return new Response(json, {
				status: 200,
				headers: {
						...corsHeaders(env),
						"Content-type": "application/json"
				}
		});
});

/*
Example post body
{ "id": "68448" }
*/
router.put('/games/return', async (request, env, context) => {
		if (request.headers.get('x-cfp') != env.CFP_PASSWORD) {
			return new Response(JSON.stringify({"error": "forbidden"}), {
				status: 403,
				headers: {
					...corsHeaders(env),
					"Content-type": "application/json"
				}
			});
		}
		let game = await request.json();
		if (game == undefined) {
			return new Response(JSON.stringify({'error': 'Please provide the id of the game you are returning.'}), {
				status: 400,
				headers: {
					...corsHeaders(env),
					"Content-type": "application/json"
				}
			});
		}

		let resp = await env.borrowed.delete(game.id);

		return new Response(JSON.stringify(game), {
				status: 200,
				headers: {
						...corsHeaders(env),
						"Content-type": "application/json"
				}
		});
});

/*
This is the last route we define, it will match anything that hasn't hit a route we've defined
above, therefore it's useful as a 404 (and avoids us hitting worker exceptions, so make sure to include it!).

Visit any page that doesn't exist (e.g. /foobar) to see it in action.
*/

export const withCorsPreflight = (request, env, context) => {
		if (request.method.toLowerCase() === 'options') {
				return new Response('ok', {
						headers: corsHeaders(env),
				});
		}
};
router.all('*', withCorsPreflight)
	.all('*', (request, env, context) => new Response('404, not found!', { status: 404, headers:{...corsHeaders(env)} }));



export default {
	fetch: router.handle,
	async scheduled(event, env, ctx) {
		const json = await getBorrowed(env);
		ctx.waitUntil(emailLateBorrowers(json));
	},
};
