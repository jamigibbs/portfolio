### Summary

This is the personal site for Jami Gibbs. It's built using:

- [Foundation 6](http://foundation.zurb.com/)
- [Sass](http://sass-lang.com/)
- [Github Pages](https://pages.github.com/)
- [Magic](http://giphy.com/gifs/VHngktboAlxHW)

### Fork Me

You're welcome to use this repo as a starting point for your own portfolio with Github Pages. Here are some steps to get you started:

1. Update the `CNAME` file with your own domain

2. [Configure your domain with your DNS provider](https://help.github.com/articles/setting-up-a-custom-domain-with-github-pages/)

*Alternately, you can use the default Github url (ie. http://username.github.io/repository) and not bother messing around with a custom domain*

3. Install Sass if you don't have it already:

```
gem install sass
```

4. `cd` into your project folder and begin compiling your Sass:

```
sass --watch scss/style.scss:css/style.css
```

If you’re working on a large project with many Sass files, you can tell Sass to just watch your Sass directory and update your CSS directory.
Once my project is all set up, I like to use the command:

```
sass --watch scss:css
```
