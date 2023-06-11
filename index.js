import { Router } from 'itty-router';

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

/*
Example post body
{
   "id": "splendor",
   "borrowed": {
     "name":"Paul",
     "email":"pajones@adobe.com",
     "date":"2023-05-12"
   }
}
*/
router.put('/games/borrow', async (request, env, context) => {
		if (request.headers.get('x-cfp') != env.CFP_PASSWORD) {
				return new Response(JSON.stringify({"error": "forbidden"}), {status: 403});
		}
		let content = await request.json();
		if (content == undefined) {
				return new Response('Please provide borrowers information.');
		}

		let game = await env.games.get(content.id, { type: "json" });
		game.borrowed = content.borrowed;

		let json = JSON.stringify(game);
		// Just hoping it will finish correctly async.
		env.games.put(game.id, json);

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
{ "id": "splendor" }
*/
router.put('/games/return', async (request, env, context) => {
		if (request.headers.get('x-cfp') != env.CFP_PASSWORD) {
				return new Response(JSON.stringify({"error": "forbidden"}), {status: 403});
		}
		let content = await request.json();
		if (content == undefined) {
				return new Response('Please provide borrowers information.');
		}

		let game = await env.games.get(content.id, { type: "json" });
		delete game.borrowed;

		let json = JSON.stringify(game);
		// Just hoping it will finish correctly async.
		env.games.put(game.id, json);

		return new Response(json, {
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
router.all('*', withCorsPreflight).all('*', () => new Response('404, not found!', { status: 404 }));

export default {
	fetch: router.handle,
};
