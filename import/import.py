import requests
import os
import json
import xml.etree.ElementTree as ET
import time


def import_games():
		code = 0
		while 200 != code:
				response = requests.get('https://api.geekdo.com/xmlapi2/collection?username=bgglehiadobe')
				code = response.status_code
				if response.status_code != 200:
						print('Failed to get game list. Trying again in 5 seconds')
						time.sleep(5)

		root = ET.fromstring(response.text)
		games = []
		for item in root.findall('./item'):
				id = item.attrib['objectid']
				game = {'id': id}
				for child in item:
						if child.tag == 'name':
								game['name'] = child.text
						if child.tag == 'thumbnail':
								game['cover'] = child.text
				games.append({'key': id, 'value': json.dumps(game)})

		response = requests.put(
				'https://api.cloudflare.com/client/v4/accounts/9f58823c0b8a788d8bb3b63414f3a085/storage/kv/namespaces/dcac29c99a834640839eb31c360882ee/bulk',
				headers={
						'Content-Type': 'application/json',
						'X-Auth-Email': 'shagreel@gmail.com',
						'X-Auth-Key': os.environ['API_KEY']
				},
				data=json.dumps(games))

		print(response.status_code, response.text)
		print(json.dumps(games))


import_games()
