---
title: "A Handmade Container"
pubDate: 2026-07-31
description: "This week, I understood WHY a container runtime like Docker's NEEDS an underlying Linux system to run, even if it is virtual: because a container is nothing more than a bunch of Linux tools bunched up together, taking advantage of the kernel's file system and a bunch of other niceties. This made me think: can I figure out how to make my own containerized environment from scratch?"
author: "João Louceiro"
tags: ["containers", "linux"]
---

## O que é um container?

Um container é um sistema de ficheiros isolado. É uma "caixa" na qual uma aplicação tem tudo aquilo que precisa para viver feliz e livre de conflitos com outras aplicações.

Podemos dizer que os dois maiores problemas que os containers resolvem são a _resolução de conflitos de dependências_ e a _inconsistência do ambiente_ ("na minha máquina funciona").

Imaginemos um cenário simples:

- A `App A` precisa do `python 2.7`, do `Django 1.8` e do `OpenSSL 1.0`.
- A `App B` precisa do `python 3.9`, do `Django 4.2` e do `OpenSSL 3.0`.

Num ambiente sem containers, ambas as aplicações partilham a instalação do `python`, o que pode levar a conflitos. Podemos resolver isso de várias formas (por exemplo através do uso judicioso do `update-alternatives`), mas é susceptível a erros.

O `Django` pode ou não estar instalado a nível global. Se estiver, vamos ter muito trabalho a corrigir problemas no caso de haver um update obrigatório.

E o `OpenSSL`? Enquanto biblioteca do sistema, claro que há a possibilidade de ter mais do que uma versão... Mas isso só pode ser conseguido com recurso a ferramentas extra e muita dor de cabeça.

Tradicionalmente, estes problemas eram resolvidos através do uso de máquinas virtuais. Mas os containers oferecem uma solução mais leve, rápida e simples de usar. Em vez de simular uma máquina inteira, estas ferramentas dizem o seguinte: _e se mantivéssemos a camada mais baixa intacta_, o kernel, _intacta, mas criássemos um novo sistema de ficheiros_, uma nova estrutura de pastas, programas, ferramentas, _isolada de tudo o resto?_

> [!NOTE] O sistema de ficheiros Linux
> Não seria possível falar sobre o sistema de ficheiros do Linux sem falar do sacramento binário: _em Linux, tudo é um ficheiro_. Pastas, documentos e até dispositivos são tratados como ficheiros. Adiante

Contentemo-nos com esta definição: na sua base, _um container nada mais é do que um sistema de ficheiros dentro do anfitrião, mas isolado do mesmo_[^1]. Para perceber melhor como isolar esse sistema, precisamos de falar sobre _namespaces_.

---

## Namespaces, o que são?

No mundo da computação, o termo _namespace_ é utilizado para referir um agrupamento de "coisas". Segundo a Wikipedia:

> A namespace in computer science (sometimes also called a name scope) is an abstract container or environment created to hold a logical grouping of unique identifiers or symbols (i.e. names). [^2]

Ora chamem-me Alberto e girem-me três vezes! Está ali mesmo: "an abstract _container_ or _environment_"!

No contexto de Linux, os namespaces permitem fazer uma associação entre processos e recursos, de forma a que esses processos só tenham conhecimento desses mesmos recursos. De acordo com a [página do manual](https://man7.org/linux/man-pages/man7/namespaces.7.html#DESCRIPTION):

> A namespace wraps a global system resource in an abstraction that
> makes it appear to the processes within the namespace that they
> have their own isolated instance of the global resource. Changes
> to the global resource are visible to other processes that are
> members of the namespace, but are invisible to other processes.
> One use of namespaces is to implement containers.

Bom, parece que encontrámos tudo o que precisamos. Foi um prazer, até à próxima!

... Ou então...

---

## Explorando os namespaces

> [!danger] Segue à tua conta e risco
> Os comandos em seguida podem ter efeitos secundários que vão para além dos meus parcos conhecimentos. Se decidirem segui-los, aconselho vivamente que o façam numa máquina virtual.

Comecemos por um pequeno teste. Com dois terminais abertos (chamemos-lhes `Host` e `Guest`), executamos o seguinte comando (no `Guest`) para criar um _mount namespace_:

```bash
# jlouceiro@mockdock:~$
sudo unshare --mount bash
```

Este comando vai executar o processo `bash` no seu próprio _namespace de pontos de montagem_ (isto vai ser importante daqui a nada). Por agora, nada de fascinante a apontar. Abrimos uma shell com o root user, com extra steps.

De seguida criamos um novo ficheiro numa nova pasta, usando o terminal `Host`:

```shell
# jlouceiro@mockdock:~$
mkdir /tmp/foo
echo "Hello world!" >> /tmp/foo/hello.txt
```

De volta ao `Guest`, algo parece não estar certo. Afinal de contas, este namespace tem acesso à pasta e ao ficheiro!

```shell
# root@dockmock:~#
ls -l /tmp/foo
total 4
-rw-rw-r-- 1 foo foo 16 Jul 31 03:19 hello.txt
```

Na verdade, isto é, de certa forma, expectável: o namespace que criámos é de pontos de montagem, não de sistema de ficheiros. Para ver o impacto que o namespace tem, temos de fazer isso mesmo: usar pontos de montagem.

```shell
# root@dockmock:~#
mount --bind /tmp/foo /mnt
```

> [!NOTE] Porquê `--bind`?
> O comando `mount` é utilizado para adicionar ramos à nossa árvore de ficheiros, por exemplo para tornar os ficheiros num disco USB acessível ao nosso sistema.
>
> A flag `--bind` é utilizada quando queremos criar um novo ramo a partir de dados que já estão na nossa árvore.
>
> Quando vi isto pela primeira vez, questionei-me: "então mas porque não usar uma ligação simbólica?"
>
> O symlink é apenas um ficheiro com a referência a outro ficheiro. Qualquer operação feita sobre um link simbólico é feita na localização original do ficheiro.
> **CONTINUAR**

O comando acima cria um novo ponto de montagem em `/mnt` que aponta para o diretório `/tmp/foo`. Este ponto de montagem só está disponível no namespace do `Guest`. Duvidas?

```shell
# root@dockmock:~# (Guest)
ls -l /mnt
total 4
-rw-rw-r-- 1 foo foo 16 Jul 31 03:19 hello.txt
```

```shell
jlouceiro@dockmock:~# ls -l /mnt

total 4
-rw-rw-r-- 1 foo foo 16 Jul 31 03:19 hello.txt
```

Então o que mudou? Na verdade, apenas a tabela de pontos de montagem. O sistema de ficheiros continua a ser exatamente o mesmo.

O comando `findmnt` permite-nos explorar os sistemas de ficheiros montados.

```shell
# jlouceiro@dockmock:~# (Host)
findmnt -o TARGET,SOURCE,FSTYPE
```

```
TARGET                                        SOURCE      FSTYPE
/                                             /dev/sda2   ext4
├─/tmp                                        tmpfs       tmpfs
├─/dev                                        devtmpfs    devtmpfs
│ ├─/dev/shm                                  tmpfs       tmpfs
...
│ └─/run/user/1000                            tmpfs       tmpfs
└─/tmp                                        tmpfs       tmpfs
```

```shell
# root@dockmock:~# (Guest)
findmnt -o TARGET,SOURCE,FSTYPE
```

```
TARGET                                        SOURCE      FSTYPE
/                                             /dev/sda2   ext4
├─/tmp                                        tmpfs       tmpfs
├─/dev                                        devtmpfs    devtmpfs
│ ├─/dev/shm                                  tmpfs       tmpfs
...
│ └─/run/user/1000                            tmpfs       tmpfs
├─/tmp                                        tmpfs       tmpfs
└─/mnt                                        tmpfs[/foo] tmpfs
```

A última linha é a que nos interessa. O ponto de montagem `/mnt` só existe no namespace criado!

### Onde está o "name" no meu "namespace"?

Como já vimos, o comando `unshare` coloca um processo num novo namespace. Mas onde é que eu o posso encontrar?

Os _process filesystem (procfs)_ são um conjunto de diretórios dinâmicos, com informação detalhada sobre os processos atualmente em execução no Linux. A estrutura é sempre `/proc/<pid>/<file>`, em que diferentes files dão acesso a diferentes informações.

Comecemos por procurar o PID da shell em execução no nosso `Guest`.

```shell
# root@dockmock:~# (Guest)
echo $$
```

Com este ID em mão, podemos aceder aos diferentes namespaces aos quais o processo está associado, através do diretório `/proc/<pid>/ns/`:

```shell
# root@dockmock:~# (Guest)
ls -la /proc/3854/ns
```

```
total 0
dr-x--x--x 2 root root 0 Jul 31 05:02 .
dr-xr-xr-x 9 root root 0 Jul 31 05:02 ..
lrwxrwxrwx 1 root root 0 Jul 31 05:02 cgroup -> 'cgroup:[4026531835]'
lrwxrwxrwx 1 root root 0 Jul 31 05:02 ipc -> 'ipc:[4026531839]'
lrwxrwxrwx 1 root root 0 Jul 31 05:02 mnt -> 'mnt:[4026532193]'
...
lrwxrwxrwx 1 root root 0 Jul 31 05:16 uts -> 'uts:[4026531838]'
```

Se compararmos esta lista com a de qualquer outro processo no namespace global, podemos ver que apenas o symlink `mnt` aponta para um ponto diferente:

```shell
# root@dockmock:~# (Guest)
ls -la /proc/1/ns
```

```
total 0
dr-x--x--x 2 root root 0 Jul 31 05:16 .
dr-xr-xr-x 9 root foo  0 Jul 31 02:39 ..
lrwxrwxrwx 1 root root 0 Jul 31 05:16 cgroup -> 'cgroup:[4026531835]'
lrwxrwxrwx 1 root root 0 Jul 31 05:16 ipc -> 'ipc:[4026531839]'
lrwxrwxrwx 1 root root 0 Jul 31 05:16 mnt -> 'mnt:[4026531832]'
...
lrwxrwxrwx 1 root root 0 Jul 31 05:16 uts -> 'uts:[4026531838]'
```

Então e os restantes ficheiros nesta pasta? Se voltarmos um pouco atrás, quando executámos o comando `unshare` pela primeira vez, fizémo-lo com a flag `--mount`, certo? Os restantes ficheiros correspondem aos diferentes tipos de namespace que podemos criar. Voltaremos a este tópico mais tarde.

## Criando um novo sistema de ficheiros

OK, daqui em diante, vamos trabalhar com o seguinte objetivo: criar uma réplica de um container com o Linux Alpine... Mais ou menos.

Para começar, vamos explorar um pouco deste container.

```sh
# jlouceiro@mockdock:~$
docker run -it --entrypoint /bin/sh --rm --name "alpine-container" alpine
/ # ls -la
```

```
total 64
drwxr-xr-x    1 root     root          4096 Aug  2 10:27 .
drwxr-xr-x    1 root     root          4096 Aug  2 10:27 ..
-rwxr-xr-x    1 root     root             0 Aug  2 10:27 .dockerenv
drwxr-xr-x    2 root     root          4096 Jun 13 16:38 bin
drwxr-xr-x    5 root     root           360 Aug  2 10:27 dev
drwxr-xr-x    1 root     root          4096 Aug  2 10:27 etc
drwxr-xr-x    2 root     root          4096 Jun 13 16:38 home
drwxr-xr-x    6 root     root          4096 Jun 13 16:38 lib
drwxr-xr-x    5 root     root          4096 Jun 13 16:38 media
drwxr-xr-x    2 root     root          4096 Jun 13 16:38 mnt
drwxr-xr-x    2 root     root          4096 Jun 13 16:38 opt
dr-xr-xr-x  315 root     root             0 Aug  2 10:27 proc
drwx------    1 root     root          4096 Aug  2 10:28 root
drwxr-xr-x    3 root     root          4096 Jun 13 16:38 run
drwxr-xr-x    2 root     root          4096 Jun 13 16:38 sbin
drwxr-xr-x    2 root     root          4096 Jun 13 16:38 srv
dr-xr-xr-x   13 root     root             0 Aug  2 10:27 sys
drwxrwxrwt    2 root     root          4096 Jun 13 16:38 tmp
drwxr-xr-x    7 root     root          4096 Jun 13 16:38 usr
drwxr-xr-x   11 root     root          4096 Jun 13 16:38 var
```

Nada de novo. Temos aqui um

| Namespace | Flag            | Page                  | Isolates                             |
| --------- | --------------- | --------------------- | ------------------------------------ |
| Cgroup    | CLONE_NEWCGROUP | cgroup_namespaces(7)  | Cgroup root directory                |
| IPC       | CLONE_NEWIPC    | ipc_namespaces(7)     | System V IPC, POSIX message queues   |
| Network   | CLONE_NEWNET    | network_namespaces(7) | Network devices, stacks, ports, etc. |
| Mount     | CLONE_NEWNS     | mount_namespaces(7)   | Mount points                         |
| PID       | CLONE_NEWPID    | pid_namespaces(7)     | Process IDs                          |
| Time      | CLONE_NEWTIME   | time_namespaces(7)    | Boot and monotonic clocks            |
| User      | CLONE_NEWUSER   | user_namespaces(7)    | User and group IDs                   |
| UTS       | CLONE_NEWUTS    | uts_namespaces(7)     | Hostname and NIS domain name         |

---

[^1]: Enquanto que numa [[Virtualização|Máquina Virtual]] criamos um sistema inteiro novo, incluindo o seu kernel, um container partilha muito do sistema com o seu anfitrião.

[^2]: <https://en.wikipedia.org/wiki/Namespace#Computer-science_considerations>
