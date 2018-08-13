
echo hello deploy_test.sh

#echo "Host github.com" >> ~/.ssh/config
#echo "User circleci" >> ~/.ssh/config
#echo "Hostname github.com" >> ~/.ssh/config

echo -e "StrictHostKeyChecking=no" >> ~/.ssh/config
echo ----
cat ~/.ssh/config
echo ----

apt-get update
apt-get -y install openssh-client git

ls -al ~/.ssh/
#mv ~/.ssh/id_rsa_6e06f56e13a83fa21d698d470e441e75 ~/.ssh/id_rsa
ssh-add -l
ssh-add ~/.ssh/id_rsa_6e06f56e13a83fa21d698d470e441e75
ssh-add -l

pwd
ls -al
ls -al /
ls -al /home
ls -al /root
uname -a
whoami

mkdir ../work
cd ../work

git clone git@github.com:yorifuji/seaside-demo.git
cd seaside-demo

git config --global user.email "yorifuji.github@gmail.com"
git config --global user.name "yorifuji@circleci-deploy-bot"

git remote add seaside git@github.com:yorifuji/seaside.git
git remote -v

git fetch seaside
git merge seaside/master 

git log --graph --decorate --all | head

git push









