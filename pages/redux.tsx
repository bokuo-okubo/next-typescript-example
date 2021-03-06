import withRedux from 'next-redux-wrapper'
import RootState from 'store/root-state'
import * as API from '../api/stories'
import { initialProps } from '../components/pages/hoc'
import { Redux, ReduxActions, ReduxProps } from '../components/pages/redux'
import { CounterAction, decrement, decrementAsync, increment, incrementAsync } from '../store/counter/actions'
import { initializeStore } from '../store/index'
import { fetchStory, fetchTopStories, StoriesAction } from '../store/stories/actions'

type ReduxAction = CounterAction | StoriesAction

class ReduxActionDispatcher implements ReduxActions {
  private dispatch: (action: ReduxAction) => void
  constructor(dispatch: (action: ReduxAction) => void) {
    this.dispatch = dispatch
    this.incrementAsync = this.incrementAsync.bind(this)
    this.decrementAsync = this.decrementAsync.bind(this)
  }
  public increment(delta: number) {
    this.dispatch(increment({ delta }))
  }
  public decrement(delta: number) {
    this.dispatch(decrement({ delta }))
  }
  public async incrementAsync() {
    const params = { delta: 1 }
    this.dispatch(incrementAsync.started(params))
    try {
      setTimeout(() => {
        this.dispatch(
          incrementAsync.done({
            params,
            result: params.delta
          })
        )
      }, 1000)
    } catch (e) {
      this.dispatch(
        incrementAsync.failed({
          params,
          error: e.message
        })
      )
    }
  }
  public async decrementAsync() {
    const params = { delta: 1 }
    this.dispatch(decrementAsync.started(params))
    try {
      setTimeout(() => {
        this.dispatch(
          decrementAsync.done({
            params,
            result: params.delta
          })
        )
      }, 1000)
    } catch (e) {
      this.dispatch(
        decrementAsync.failed({
          params,
          error: e.message
        })
      )
    }
  }
  public async fetchStoryAsync(id: number) {
    this.dispatch(fetchStory.started(id))
    try {
      const story = await API.fetchStory(id)
      this.dispatch(
        fetchStory.done({
          params: id,
          result: story
        })
      )
    } catch (e) {
      this.dispatch(
        fetchStory.failed({
          params: id,
          error: e.message
        })
      )
    }
  }
}

const mapStateToProps = ({ counter, stories }: RootState) => {
  return {
    counter,
    stories
  }
}

const mapDispatchToProps = dispatch => {
  return {
    actions: new ReduxActionDispatcher(dispatch)
  }
}

const enhance = initialProps<ReduxProps>(async ({ store, isServer }) => {
  if (isServer) {
    store.dispatch(increment({ delta: 5 }))
  }
  const ids = (await API.fetchTopStoryIds()).slice(0, 5)
  store.dispatch(
    fetchTopStories.done({
      params: {},
      result: ids
    })
  )
})

export default withRedux(initializeStore, mapStateToProps, mapDispatchToProps)(enhance(Redux))
