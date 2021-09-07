echo "user:$1 twit message: $2"
http POST "http://localhost:3030/users/$1/twits" message="$2"