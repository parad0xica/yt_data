window.onload = function() {

  let likesChart, viewsChart, commentsChart;

  const channelForm = document.getElementById('channel-form');
  const channelUrlInput = document.getElementById('channel-url'); //declare this outside of/before the event listener

  channelForm.addEventListener('submit', function(e) {            
    e.preventDefault();

    const channelUrl = channelUrlInput.value;     

    fetch('/channel-stats', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',      //specifying type is mandatory coz otherwise server won't interpret this as JSON
        },
        body: JSON.stringify({ url: channelUrl }),      //stringifying body and mapping new JSON object to send to server
    })
    .then(response => response.json())
    .then(data => {
      const videoStats = data.videoStats;
      const averages = data.averages;

      var graphsSection = document.getElementById('graphs');       
      graphsSection.style.display = 'block'; // Show the graphs section on response load

      setTimeout(function() {         //smooth transition to graph section on response load
        graphsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);

      document.getElementById('comefunziona').style.display = 'none';     //will hide guide upon press of submit button
      
      document.getElementById('avgLikes').textContent = averages.avgLikes.toFixed(0);   //0 means no numbers after virgola
      document.getElementById('avgViews').textContent = averages.avgViews.toFixed(0);
      document.getElementById('avgComments').textContent = averages.avgComments.toFixed(0);

      const labels = videoStats.map(item => new Date(item.publishedAt).toLocaleDateString());       //declaring easier consts by mapping values
      const likesData = videoStats.map(item => item.likeCount);
      const viewsData = videoStats.map(item => item.viewCount);
      const commentsData = videoStats.map(item => item.commentCount);


      if (likesChart) likesChart.destroy();                                   //destroy because otherwise client would have to reload page before being able to use new input
      likesChart = new Chart(document.getElementById('likesChart'), {         //retrieving canvas
        type: 'line',         //line chart
        data: {               //defines which data will be displayed
          labels: labels,     //will show time of publish on hover
          datasets: [{
            label: 'Likes',      
            data: likesData,       
            fill: true,         //colors under the line
            borderColor: 'rgb(75, 192, 192)',    //line color
            tension: 0.4,    //curvature
            pointRadius: 4,
            pointBackgroundColor: 'rgb(75, 192, 192)'
          }]
        }
      });

      if (viewsChart) viewsChart.destroy();
      viewsChart = new Chart(document.getElementById('viewsChart'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Views',
            data: viewsData,
            fill: true,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.4,  
            pointRadius: 4,
            pointBackgroundColor: 'rgb(75, 192, 192)'
          }]
        }
      });

      if (commentsChart) commentsChart.destroy();
      commentsChart = new Chart(document.getElementById('commentsChart'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Comments',
            data: commentsData,
            fill: true,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: 'rgb(75, 192, 192)'
          }]
        }
      });

      // clear the input field
      channelUrlInput.value = '';
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  });
  
}