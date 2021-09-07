echo "user-id:$1, twit-id: $2"
http POST ":3030/users/$1/twits/$2/like"