
echo hello deploy_test.sh

echo -e "StrictHostKeyChecking=no" >> ~/.ssh/config
echo ----
cat ~/.ssh/config
echo ----

ssh-add -l

mkdir ../work
cd ../work

git clone git@github.com:yorifuji/seaside-demo.git
cd seaside-demo

git config --global user.email "${GIT_USER_EMAIL}" # env from circle ci
git config --global user.name "${GIT_USER_NAME}"   # env from circle ci

git remote add seaside git@github.com:yorifuji/seaside.git
git remote -v

git fetch seaside
git merge seaside/master -m "circleci: automatic commit"

git push origin master










