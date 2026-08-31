REGIONS="us-east-1 us-west-1 us-west-2 eu-west-1 eu-west-2 eu-west-3 eu-central-1 ap-southeast-1 ap-northeast-1 ap-northeast-2 ap-southeast-2 ap-south-1 sa-east-1"
for r in $REGIONS; do
  echo "Testing $r..."
  psql "postgresql://postgres.afteoovednmgpmvrgtrp:usman0411051122@aws-0-$r.pooler.supabase.com:5432/postgres" -c "SELECT 1;" > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "SUCCESS: $r"
    exit 0
  fi
done
echo "FAILED ALL"
