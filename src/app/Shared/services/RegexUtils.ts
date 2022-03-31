class RegexUtils {

    escape(pattern: string) {
        if (!pattern) return;
        return pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    isEmail(email: string) {
        if (email) {
            return !!email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
        }
        return false;
    }

    makeCaseInsensitive(text: string) {
        return new RegExp('^' + this.escape(text) + '$', 'i');
    }

}

export let regexUtils = new RegexUtils();
