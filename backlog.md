# Backlog | Todos

TicketIdentifier | Description
--- | --- 
 __#BUG-1__ | 'notifyAt' seems to be buggy: when counting down the 'beforeEnd' event won't fire (when counting up, the 'afterStart' seems broken)
 __#BUG-2__ | when not displaying the milliseconds to the user, it seems like a bug (to him) that a second is "missing" (because of rounding issues)
 -| 
 __#TASK-1__ | improve error handling strategy (and convenience methods!) for public methods
 __#TASK-2__ | add some Jasmine tests
 __#TASK-3__ | use a templating framework (e.g. handlebars) to demonstrate the power of the CountResult.formattedTime()
 - |  
 __#FEATURE-2__ | get progress in % (e.g. 13% are already counted down/up)
 __#FEATURE-3__ | provide option: CONTINUE_AFTER_FINISH and STOP_AFTER_FINISH (e.g. when counting from 10, should the counter stop at 0, or should it go further [e.g. to -100])
 __#FEATURE-4__ | provide the possibility to not just only count the time, but also other numeric stuff (e.g. count +1 every time one hits a button)
 __#FEATURE-5__ | provide the possibility count down or up to a specific date


# Done
TicketIdentifier | Description
--- | ---
 __#FEATURE-1__ | be able to add the config after instantiation (e.g. setOptions(options))