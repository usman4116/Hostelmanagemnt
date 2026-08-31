URL="postgresql://postgres.afteoovednmgpmvrgtrp:usman0411051122@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

for file in $(ls -1 supabase/migrations/*.sql | sort); do
  echo "Applying $file..."
  psql "$URL" -f "$file"
  if [ $? -ne 0 ]; then
    echo "ERROR applying $file"
    exit 1
  fi
done
echo "ALL DONE"
