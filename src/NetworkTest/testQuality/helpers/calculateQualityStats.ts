import { SubscriberStats } from '../../types/opentok/subscriber';
import { AV, HasAudioVideo, QualityStats } from '../types/stats';

function calculateStats(type: AV, samples: SubscriberStats[]): QualityStats[] {

  const qualityStats: QualityStats[] = [];

  for (let i = 1; i < samples.length; i += 1) {

    const currStat = samples[i];
    const prevStat = samples[i - 1];

    if (currStat[type] && prevStat[type]) {
      const bytesIncreased = currStat[type].bytesReceived ?
        currStat[type].bytesReceived - prevStat[type].bytesReceived : 0;
      const bitsIncreased = bytesIncreased * 8;
      const msIncreased = currStat.timestamp - prevStat.timestamp;
      const secondsElapsed = msIncreased / 1000;
      const averageBitrate = bitsIncreased / secondsElapsed;

      // packetsLosts and total expected packets from current stats
      const currentPacketsLost = currStat[type].packetsLost;
      const currentTotalPackets = currStat[type].packetsLost + currStat[type].packetsReceived;

      // packetsLosts and total expected packets from previous stats
      const prevPacketsLost = prevStat[type].packetsLost;
      const prevTotalPackets = prevStat[type].packetsLost + prevStat[type].packetsReceived;

      // Calculate packetLossRatio
      const totalPackets = currentTotalPackets - prevTotalPackets;
      const packetLossRatio = (currentPacketsLost - prevPacketsLost) / totalPackets;

      const frameRate = type === 'video' ? { frameRate: currStat[type].frameRate } : {};

      qualityStats.push({ averageBitrate, packetLossRatio, ...frameRate });
    }
  }

  return qualityStats;
}

export default function calculateQualityStats(latestSamples: SubscriberStats[]): HasAudioVideo<QualityStats[]> {
  if (latestSamples.length < 2) {
    throw new Error('Cannot calculate bitrate with less than two data points.');
  }

  return {
    audio: calculateStats('audio', latestSamples),
    video: calculateStats('video', latestSamples),
  };
}
