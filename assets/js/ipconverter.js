document.addEventListener("DOMContentLoaded", function () {
  const darkModeToggle = document.getElementById('darkModeToggle');

  darkModeToggle.addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark');

    // Update button text based on mode
    if (isDarkMode) {
      darkModeToggle.innerHTML = '<span class="moon-icon">🌙</span>Light Mode';
    } else {
      darkModeToggle.innerHTML = '<span class="moon-icon">🌙</span>Dark Mode';
    }
  });

  document.getElementById('convertButton').onclick = function () {
    const ip = document.getElementById('ipInput').value;
    const subnetMask = document.getElementById('subnetMask').value.trim();
    const outputDiv = document.getElementById('output');

    // Clear previous output
    outputDiv.innerHTML = '';

    if (validateIP(ip)) {
      const isIPv4 = ip.includes('.');
      let result;

      // If subnet mask is provided, validate it; if not, just convert the IP
      if (subnetMask === '' || validateSubnetMask(ip, subnetMask)) {
        result = convertIPv4(ip, subnetMask);
        outputDiv.innerHTML = `<div class="output">${result}</div>`;
        outputDiv.style.display = 'block'; // Show output div
      } else {
        outputDiv.innerHTML = `<div class="output error">Invalid subnet mask.</div>`;
        outputDiv.style.display = 'block'; // Show output div
      }
    } else {
      outputDiv.innerHTML = `<div class="output error">Invalid IP address.</div>`;
      outputDiv.style.display = 'block'; // Show output div
    }
  };

  // Function to validate IP
  function validateIP(ip) {
    const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Pattern.test(ip);
  }

  // Function to validate Subnet Mask
  function validateSubnetMask(ip, subnetMask) {
    const validIPv4Masks = Array.from({ length: 33 }, (_, i) => i); // 0 to 32
    const subnetPattern = /^\d+$/; // Matches the format /number

    if (!subnetPattern.test(subnetMask.replace('/', ''))) return false;

    const maskValue = parseInt(subnetMask.replace('/', ''), 10);
    return validIPv4Masks.includes(maskValue);
  }

  // Function to convert IPv4 and Subnet Mask
  function convertIPv4(ip, subnetMask) {

    // Split the original IP into octets
    const octets = ip.split('.').map(Number);

    // Store the original IP for IP class determination
    const originalIP = ip;

    // Calculate the IP class using the original IP address (Always)
    const ipClass = getIPClass(originalIP);

    // Convert each octet to octal format and join with '.'
    const octal = octets.map(octet => octet.toString(8)).join('.');

    // Convert each octet to hexadecimal format, pad with zeros, and prefix with '0x'
    const hex = '0x' + octets.map(octet => octet.toString(16).padStart(2, '0')).join('');

    // Convert the octets to a single 32-bit integer representation
    const integer = (octets.reduce((acc, octet) => (acc << 8) + octet, 0) >>> 0);

    // Convert each octet to binary format, pad with zeros, and prefix with '0b'
    const binary = '0b' + octets.map(octet => octet.toString(2).padStart(8, '0')).join('');

    // Convert the integer to network byte order (big-endian)
    const networkByteOrder = htonl(integer);

    // Convert octets to little-endian format
    const littleEndian = toLittleEndian(octets);

    // Store the integer in big-endian format
    const bigEndian = integer;

    // Get the reverse DNS format (in-addr.arpa)
    const inAddrArpa = getInAddrArpa(octets);

    // Function to determine the IP class
    function getIPClass(ip) {
      const firstOctet = octets[0];
      if (firstOctet >= 1 && firstOctet <= 126) return 'A';    // Class A
      if (firstOctet >= 128 && firstOctet <= 191) return 'B';  // Class B
      if (firstOctet >= 192 && firstOctet <= 223) return 'C';  // Class C
      if (firstOctet >= 224 && firstOctet <= 239) return 'D';  // Class D
      return 'E'; // Class E
    }

    // Function to convert a 32-bit integer to Big Endian (Network Byte Order)
    function htonl(num) {
      return ((num >>> 24) & 0xFF) |
      ((num >>> 8) & 0xFF00) |
      ((num & 0xFF00) << 8) |
      ((num & 0xFF) << 24);
    }

    // Function to convert an array of 4 octets to a 32-bit integer in Little Endian format
    function toLittleEndian(octets) {
      return (octets[3] << 24) | (octets[2] << 16) | (octets[1] << 8) | octets[0];
    }

    // Function to generate in-addr.arpa notation
    function getInAddrArpa(octets) {
      return `${octets.reverse().join('.')}.in-addr.arpa`;
    }

    // Start subnet calculation only if subnetMask is provided
    let subnetInfo = '';
    if (subnetMask) {

      // Extract the number of bits in the subnet mask from the provided string (e.g., "/24")
      const maskBits = parseInt(subnetMask.replace('/', ''), 10);

      // Ensure subnet calculations are performed without changing the IP class
      // Calculate the subnet address using the provided octets and mask bits
      const subnet = calculateSubnet(octets, maskBits);

      // Get the dotted-decimal representation of the subnet mask
      const dottedDecimalNetmask = getDottedDecimalNetmask(maskBits);

      // Calculate the wildcard mask based on the subnet mask bits
      const wildcardMask = getWildcardMask(maskBits);

      // Get the binary representation of the subnet mask
      const binarySubnetMask = getBinarySubnetMask(maskBits);

      // Function to calculate the Subnet
      function calculateSubnet(octets, maskBits) {

        // Subnet mask by shifting bits left and filling with 1s for valid bits
        const subnetMask = (0xFFFFFFFF << (32 - maskBits)) >>> 0;

        // Convert the IP address from octets to a single integer for calculations
        const ipAsInt = octets.reduce((acc, octet) => (acc << 8) + octet, 0);

        // Calculate the network address by performing a bitwise AND with the subnet mask
        const networkAddress = ipAsInt & subnetMask;

        // Calculate the broadcast address by performing a bitwise OR with the inverted subnet mask
        const broadcastAddress = networkAddress | (~subnetMask >>> 0);

        // Calculate the total number of hosts in the subnet based on the mask bits
        const totalHosts = Math.pow(2, 32 - maskBits);

        // Initialize the number of usable hosts (to be calculated below)
        let usableHosts = 0;

        // Adjusting usableHosts for /31 and /32
        if (maskBits === 31) {
          usableHosts = 0;
        } else if (maskBits === 32) {
          // No usable hosts, as there's only one address
          usableHosts = 0;
        } else {
          usableHosts = totalHosts - 2;
        }

        // Total hosts is the same for /31
        let usableIP, numHosts = totalHosts;

        if (maskBits === 32) {
          usableIP = intToDottedDecimal(networkAddress);
        } else if (maskBits === 31) {
          // For /31, we still state the addresses but note usable hosts count as 0
          usableIP = `${intToDottedDecimal(networkAddress)} - ${intToDottedDecimal(broadcastAddress)}`;
        } else {
          // General case for subnets other than /31 and /32
          const usableStart = networkAddress + 1;
          const usableEnd = broadcastAddress - 1;
          usableIP = `${intToDottedDecimal(usableStart)} - ${intToDottedDecimal(usableEnd)}`;
        }

        return {
          network: intToDottedDecimal(networkAddress),
          broadcast: intToDottedDecimal(broadcastAddress),
          usableIP,
          numHosts: formatNumber(numHosts),
          usableHosts: formatNumber(usableHosts),
          netmask: intToDottedDecimal(subnetMask)
        };
      }

      // Function to convert a 32-bit integer to a dotted decimal (IPv4) string representation
      function intToDottedDecimal(num) {
        return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
      }

      // Function to format large numbers with commas
      function formatNumber(num) {
        return num.toLocaleString();
      }

      // Function to calculate netmask in dotted-decimal format
      function getDottedDecimalNetmask(maskBits) {
        const mask = (0xFFFFFFFF << (32 - maskBits)) >>> 0;
        return intToDottedDecimal(mask);
      }

      // Function to calculate the wildcard mask
      function getWildcardMask(maskBits) {
        const wildcardBits = 32 - maskBits;
        const wildcard = (0xFFFFFFFF >>> (32 - wildcardBits)) >>> 0;
        return intToDottedDecimal(wildcard);
      }

      // Function to convert the subnet mask to binary
      function getBinarySubnetMask(maskBits) {
        const binary = '1'.repeat(maskBits) + '0'.repeat(32 - maskBits);
        return binary.match(/.{1,8}/g).join('.');
      }

      subnetInfo = `
      <thead>
      <tr>
      <th colspan="2">Subnet Mask ${subnetMask}</th>
      </tr>
      </thead>
      <tr>
      <td>Network Address</td>
      <td>${subnet.network}</td>
      </tr>
      <tr>
      <td>Broadcast Address</td>
      <td>${subnet.broadcast}</td>
      </tr>
      <tr>
      <td>Usable IP</td>
      <td>${subnet.usableIP}</td>
      </tr>
      <tr>
      <td>Netmask</td>
      <td>${subnetMask} (${dottedDecimalNetmask})</td>
      </tr>
      <tr>
      <td>Wildcard Mask</td>
      <td>${wildcardMask}</td>
      </tr>
      <tr>
      <td>Binary Subnet Mask</td>
      <td>${binarySubnetMask}</td>
      </tr>
      <tr>
      <td>Total Number of Hosts</td>
      <td>${subnet.numHosts}</td>
      </tr>
      <tr>
      <td>Number of Usable Hosts</td>
      <td>${subnet.usableHosts}</td>
      </tr>
      `;
    }

    // Let's return whatever we need..
    return `
    <table class="output-table">
    <thead>
    <tr>
    <th>Property</th>
    <th>Value</th>
    </tr>
    </thead>
    <tbody>
    <tr>
    <td>IPv4 Address</td>
    <td>${ip}</td>
    </tr>
    <tr>
    <td>IP Class</td>
    <td>${ipClass}</td>
    </tr>
    <tr>
    <td>Dotted Octal</td>
    <td>${octal}</td>
    </tr>
    <tr>
    <td>Hexadecimal</td>
    <td>${hex}</td>
    </tr>
    <tr>
    <td>Integer</td>
    <td>${integer}</td>
    </tr>
    <tr>
    <td>Binary Format</td>
    <td>${binary}</td>
    </tr>
    <tr>
    <td>Network Byte Order</td>
    <td>0x${networkByteOrder.toString(16).toUpperCase()}</td>
    </tr>
    <tr>
    <td>Little Endian</td>
    <td>0x${littleEndian.toString(16).toUpperCase()}</td>
    </tr>
    <tr>
    <td>Big Endian</td>
    <td>0x${bigEndian.toString(16).toUpperCase()}</td>
    </tr>
    <tr>
    <td>Reverse DNS (in-addr.arpa)</td>
    <td>${inAddrArpa}</td>
    </tr>
    ${subnetInfo}
    </tbody>
    </table>
    `;
  }
});
