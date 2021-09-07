echo "user-id:$1"
http POST :3030/users < ./scripts/test/user$1.json