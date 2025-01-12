document.addEventListener('DOMContentLoaded', function () {
    fetch('/withdraw/getWithdrawHistoryOrders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(`Server returned an error: ${data.error}`);
            }

            const tableBody = document.querySelector('.order-data tbody');
            tableBody.innerHTML = '';

            if (data && data.length > 0) {
                data.forEach(order => {
                    const row = `
                <tr>
                    <td>${order.created_at}</td>
                    <td>${order.amount} TON</td>
                    <td>${order.status}</td>
                </tr>
            `;
                    tableBody.insertAdjacentHTML('beforeend', row);
                });
            } else {
                console.log('No order history found');
            }
        })
        .catch(error => {
            console.error('Error fetching order history:', error.message);
        });
});
