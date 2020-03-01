## Configuration

A custom `config.insecure.tolm` file must be placed in the mounted data directory.
Also you must allow wrinting in the mounted data directory.

For example:

```
mkdir /mnt/volume/ucds/eth
chmod 777 -R /mnt/volume/ucds/eth
cp ./ucds/lib/blockchains/ETH/config.insecure.tolm /mnt/volume/ucds/eth/config.insecure.tolm
```