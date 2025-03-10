package org.opensearch.migrations.replay.kafka;

import java.util.Optional;
import java.util.PriorityQueue;
import java.util.StringJoiner;

import lombok.extern.slf4j.Slf4j;

/**
 * This uses a PriorityQueue to find the MINIMUM offset that has yet to be 'committed'.
 * This class assumes that add() will be called with ascending offsets and that
 * removeAndReturnNewHead may be called in any order.  removeAndReturnNewHead returns
 * the new commit offset for the partition that this object is associated with.
 * It's also assumed that callers MUST call removeAndReturnNewHead for every offset
 * that was previously added for commit points to be advanced.
 */
@Slf4j
class OffsetLifecycleTracker {
    private final PriorityQueue<Long> pQueue = new PriorityQueue<>();
    private long cursorHighWatermark;
    final int consumerConnectionGeneration;

    OffsetLifecycleTracker(int generation) {
        this.consumerConnectionGeneration = generation;
    }

    boolean isEmpty() {
        return pQueue.isEmpty();
    }

    int size() {
        return pQueue.size();
    }

    void add(long offset) {
        synchronized (pQueue) {
            cursorHighWatermark = offset;
            pQueue.add(offset);
        }
    }

    Optional<Long> removeAndReturnNewHead(long offsetToRemove) {
        synchronized (pQueue) {
            var topCursor = pQueue.peek();
            if (topCursor == null) {
                throw new IllegalStateException(
                    "pQueue looks to have been empty by the time we tried to remove " + offsetToRemove
                );
            }
            var didRemove = pQueue.remove(offsetToRemove);
            if (!didRemove) {
                throw new IllegalStateException(
                    "Expected all live records to have an entry and for them to be removed only once");
            }

            if (offsetToRemove == topCursor) {
                topCursor = Optional.ofNullable(pQueue.peek()).orElse(cursorHighWatermark + 1); // most recent cursor
                                                                                                // was previously popped
                log.atDebug().setMessage("Commit called for {}, and new topCursor={}")
                    .addArgument(offsetToRemove)
                    .addArgument(topCursor)
                    .log();
                return Optional.of(topCursor);
            } else {
                log.atDebug().setMessage("Commit called for {}, but topCursor={}")
                    .addArgument(offsetToRemove)
                    .addArgument(topCursor)
                    .log();
                return Optional.empty();
            }
        }
    }

    @Override
    public String toString() {
        synchronized (pQueue) {
            return new StringJoiner(", ", OffsetLifecycleTracker.class.getSimpleName() + "[", "]").add(
                "pQueue=" + pQueue
            )
                .add("cursorHighWatermark=" + cursorHighWatermark)
                .add("consumerConnectionGeneration=" + consumerConnectionGeneration)
                .toString();
        }
    }
}
