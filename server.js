const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');
require('dotenv').config();


const app = express();            
app.use(express.static(path.join(__dirname, 'public')));        //to server public directory on client request
app.use(cors());                   //won't work locally without it coz of xss protection
app.use(express.json());           //won't stringify JSONs without it

app.get('/ping', (req, res) => {                                //ping route I used to test client-server connection
  res.status(200).send('Server is running and reachable');
});                       

const KEY = process.env.APIKEY

const youtube = google.youtube({         //creating a new YouTube client
  version: 'v3',

  auth: KEY,    //this doesn't have to be hidden in case of local usage. If Heroku works I'll use environmental variable instead
});

app.post('/channel-stats', async (req, res) => {      ////////////////main route/////////////

  console.log('Received a request with the following body:', req.body);       

  const channelUrl = req.body.url;                          //we're declaring our server input
  const channelId = await getChannelIdFromUrl(channelUrl);  //waiting for this function to extract ID from URL

  if (!channelId) {
    return res.status(404).json({ error: 'Channel not found.' });
  }

  try {
    const videoStats = await fetchVideoStats(channelId);           //function to fetch the video stats. 
    const averages = calculateAverages(videoStats);               //function to calculate the averages. Won't initialize before fetchVideoStats is executed.

    
    const response = {               //preparing the response object
      videoStats,
      averages,
    };
    
    console.log('Response:', JSON.stringify(response, null, 2));    //for logging full response. null = no modifications. 2 = spaces between nesting levels

    res.json(response);                                   //server response in JSON format
  } catch (error) {
    res.status(500).json({ error: error.toString() });    //in case of an error
  }
});

app.listen(5500, () => console.log('Server listening on port 5500'));       //i recall Heroku automatically setting the port constant


async function getChannelIdFromUrl(url) {
  const channelName = url.split('@')[1]; // extract the channel name
  
  try {
    const response = await youtube.search.list({                //won't proceed until there's a response from API
      part: 'snippet',
      type: 'channel',
      q: channelName,
    });

    const channels = response.data.items;     //array of channels
    const Id = channels[0].id.channelId;      //first one will always be correct if it exists
    if (channels.length === 0) {
      console.log('No channel found.');        
      return null;                            //if none were found
    } else {
      console.log('This is the channel ID: ' + Id);
   
      return Id;
      
    }
  } catch (err) {                             //if API fails
    console.log('The API returned an error: ' + err);
  }
}


async function fetchVideoStats(Id) {                    
 
  const listResponse = await youtube.search.list({          //again won't execute before API response
    channelId: Id,
    maxResults: 5,
    order: 'date',
    part: 'id',
  });
  
  const videoIds = listResponse.data.items.map(item => item.id.videoId);

  const videosResponse = await youtube.videos.list({
    id: videoIds.join(','),        //sends a coma-separated string to API
    part: 'statistics,snippet',    //snippet for date, statistics for statistics
  });

  function extractHashtags(description) {
    let hashtags = description.match(/#\w+/g) || [];
    return hashtags;
  }

  const videoStats = videosResponse.data.items.map(item => ({     
    let hashtags = extractHashtags(item.snippet.description);
    return {
    videoId: item.id,                                                 //each video becomes a new object
    publishedAt: item.snippet.publishedAt,
    viewCount: item.statistics.viewCount,
    likeCount: item.statistics.likeCount,
    commentCount: item.statistics.commentCount,
    hashtags: hashtags,
    
  }));

  console.log(videoStats); 

  return videoStats;                                                   //part 1 out of 2 of server response
}

function calculateAverages(videoStats) {                               
  const total = videoStats.reduce(             //reduce initializes values at 0 and follows logic. In this case it looks like this: { likes: 0, comments: 0, views: 0 }             
    (accum, stats) => {                        //stats is the current parameter. Accum is the current sum. 
      accum.likes += Number(stats.likeCount);     //accumulating likes from stats.
      accum.comments += Number(stats.commentCount);
      accum.views += Number(stats.viewCount);    
      return accum;
    },
    { likes: 0, comments: 0, views: 0 }                 //that's our accum object (will obviously change value)
  );

  const averages = {                                    //mapping new object
    avgLikes: total.likes / videoStats.length,          //dividing by length of array to calculate averages. This means we can change code to fetch last 10 videos just in 1 click.
    avgComments: total.comments / videoStats.length,
    avgViews: total.views / videoStats.length,
  };

  console.log("Averages: ", averages);

  return averages;
}
