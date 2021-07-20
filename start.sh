echo 'Starting discord bot...'

	screen -dmS "DiscordBot" npm run dev
	sleep 1
	while [ $(screen -ls | grep -c 'No Sockets found in') -ge 1 ]; do
		echo 'Waiting for 5 seconds to start server...'
		sleep 5
		screen -dmS "DiscordBot" npm run dev
	done

echo 'Discord Bot started.'
