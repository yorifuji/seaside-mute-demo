
echo hello deploy_test.sh

echo -e "StrictHostKeyChecking=no" >> ~/.ssh/config
echo ----
cat ~/.ssh/config
echo ----

#apt-get update
#apt-get -y install openssh-client git

ssh-add -l

#pwd
#ls -al
#ls -al /
#ls -al /home
#ls -al /root
#uname -a
#whoami

mkdir ../work
cd ../work

git clone git@github.com:yorifuji/seaside-demo.git
cd seaside-demo

git config --global user.email "yorifuji.github@gmail.com"
git config --global user.name "yorifuji@circleci-deploy-bot"

git remote add seaside git@github.com:yorifuji/seaside.git
git remote -v

git fetch seaside
git merge seaside/master -m "circleci: automatic merge commit"

git log --graph --decorate --all | head

git push









